import {
  Edge,
  FunctionName,
  FunctionNode,
  Graph,
  Node,
  Type,
} from "@/protos/tierkreis/graph_pb";
import { useDataflowGraph, DFGraph, useCompiledCells } from "./state";
import { useEffect } from "react";
import { useCellActions } from "@/core/cells/cells";
import { CellId } from "@/core/cells/ids";
import { useRuntime } from "../tierkreis-runtime";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createPromiseClient } from "@connectrpc/connect";
import { TempRuntime as Runtime } from "@/protos/runtime_connect";
import { CellMessage } from "@/core/kernel/messages";
import { Time } from "@/utils/time";

/**
 * React hook to watch cell updates and execute on Tierkreis
 */
export function useTierkreisCodeExecution() {
  const graph = useDataflowGraph();
  const cells = useCompiledCells();
  const runtime = useRuntime();
  const { handleCellMessage } = useCellActions();

  // const client = new EchoServicePromiseClient(host, creds, {
  // unaryInterceptors: unaryInterceptors,
  // streamInterceptors: streamInterceptors,
  // });
  const transport = createConnectTransport({
    baseUrl: runtime.url,
    useBinaryFormat: true,
  });
  const tierkreis = createPromiseClient(Runtime, transport);

  useEffect(() => {
    const tk_graph = as_tierkreis_graph(graph);
    const request = {
      graph: tk_graph,
      runtimeId: runtime.runtimeId,
      // typeCheck: true,
    };
    async function run() {
      try {
        const runResults = await tierkreis.runGraph(request);
        switch (runResults.result.case) {
          case "error":
            throw new Error(runResults.result.value);
          case "typeErrors":
            console.log(runResults.result.value);
            break;
          case "success":
            const outputs = runResults.result.value;
            console.log("success => ", outputs);
            for (const cell of Object.values(cells)) {
              const output = outputs.map[cell.cellOutput];
              if (output) {
                if (output.value.case !== "str") {
                  throw new Error("Cell Output is not a string");
                }
                const message: CellMessage = {
                  cell_id: cell.cellId as CellId,
                  output: {
                    channel: "output",
                    mimetype: "text/plain",
                    data: output.value.value,
                    timestamp: 0,
                  },
                  console: null,
                  status: null,
                  timestamp: Time.now().toSeconds(),
                };
                handleCellMessage({
                  cellId: cell.cellId as CellId,
                  message,
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error(error);
      }
    }
    run();
  });
}

function as_tierkreis_graph(graph: DFGraph): Graph {
  let cellIdtoIndex = new Map<string, number>();

  const toFnNode = (name: FunctionName) => {
    return new Node({
      node: {
        case: "function",
        value: new FunctionNode({ name }),
      },
    });
  };

  const inNode = new Node({ node: { case: "input", value: {} } });
  const outNode = new Node({ node: { case: "output", value: {} } });
  const ioNodes = [inNode, outNode];
  const outNodeIndex = 1;
  const fnNodes: Node[] = graph.nodes().map((cellId, index) => {
    const funcId = graph.getNodeAttribute(cellId, "funcId");

    const name = new FunctionName({
      namespaces: ["pycells"],
      name: funcId,
    });

    cellIdtoIndex.set(cellId, index + 2);

    return toFnNode(name);
  });
  const internalEdges: Edge[] = graph.mapEdges((edge) => {
    const { varName, dataType } = graph.getEdgeAttributes(edge);
    const fromCellId = graph.getSourceAttribute(edge, "cellId");
    const toCellId = graph.getTargetAttribute(edge, "cellId");
    const nodeFrom = cellIdtoIndex.get(fromCellId);
    const nodeTo = cellIdtoIndex.get(toCellId);
    if (!nodeFrom || !nodeTo) {
      throw new Error("Cell not found");
    }
    return new Edge({
      portFrom: varName,
      portTo: varName,
      nodeFrom,
      nodeTo,
      edgeType: dataType,
    });
  });
  let outputEdges = graph.mapNodes((cellId) => {
    const outVar = graph.getNodeAttribute(cellId, "cellOutput");
    return outVar
      ? new Edge({
          portFrom: outVar,
          portTo: outVar,
          nodeFrom: cellIdtoIndex.get(cellId),
          nodeTo: outNodeIndex,
          edgeType: new Type({ type: { case: "str", value: {} } }),
        })
      : undefined;
  });

  return new Graph({
    nodes: ioNodes.concat(fnNodes),
    edges: internalEdges.concat(
      outputEdges.filter((edge) => edge !== undefined) as Edge[],
    ),
    name: "notebook",
    inputOrder: [],
    outputOrder: [],
  });
}
