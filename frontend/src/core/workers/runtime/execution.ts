import {
  Edge,
  FunctionName,
  FunctionNode,
  Graph,
  Node,
} from "@/protos/tierkreis/graph_pb";
import { useDataflowGraph, DFGraph, useCompiledCells } from "./state";
import { useEffect } from "react";
import { useCellActions } from "@/core/cells/cells";
import { CellId } from "@/core/cells/ids";
import { useRuntimeUrl } from "../tierkreis_runtime";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createPromiseClient } from "@connectrpc/connect";
import { Runtime } from "@/protos/tierkreis/runtime_connect";

/**
 * React hook to watch cell updates and execute on Tierkreis
 */
export function useTierkreisCodeExecution() {
  const graph = useDataflowGraph();
  const cells = useCompiledCells();
  const runtimeUrl = useRuntimeUrl();
  const { setStdinResponse } = useCellActions();

  // const client = new EchoServicePromiseClient(host, creds, {
  // unaryInterceptors: unaryInterceptors,
  // streamInterceptors: streamInterceptors,
  // });
  const transport = createConnectTransport({
    baseUrl: runtimeUrl,
    useBinaryFormat: true,
  });
  const tierkreis = createPromiseClient(Runtime, transport);

  useEffect(() => {
    const tk_graph = as_tierkreis_graph(graph);
    const request = {
      graph: tk_graph,
      typeCheck: true,
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
            for (const cell of Object.values(cells)) {
              const output = outputs.map[cell.cellOutput];
              if (output) {
                if (output.value.case !== "str") {
                  throw new Error("Cell Output is not a string");
                }
                setStdinResponse({
                  cellId: cell.cellId as CellId,
                  response: output.value.value,
                  outputIndex: 0,
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
  const fn_nodes: FunctionNode[] = graph.nodes().map((cellId, index) => {
    const funcId = graph.getNodeAttribute(cellId, "funcId");

    const name = new FunctionName({
      namespaces: [],
      name: funcId,
    });

    cellIdtoIndex.set(cellId, index);

    return new FunctionNode({ name });
  });
  const edges: Edge[] = graph.mapEdges((edge) => {
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

  const toNode = (node: FunctionNode) => {
    return new Node({
      node: {
        case: "function",
        value: node,
      },
    });
  };

  return new Graph({
    nodes: fn_nodes.map(toNode),
    edges,
    name: "notebook",
    inputOrder: [],
    outputOrder: [],
  });
}
