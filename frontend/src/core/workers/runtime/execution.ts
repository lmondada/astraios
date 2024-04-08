import {
  Edge,
  FunctionName,
  FunctionNode,
  Graph,
} from "@/protos/tierkreis/graph";
import { useDataflowGraph, DFGraph, useCompiledCells } from "./state";
import { useEffect } from "react";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { RuntimeClient } from "@/protos/tierkreis/runtime.client";
import { useCellActions } from "@/core/cells/cells";
import { CellId } from "@/core/cells/ids";
import { useRuntimeUrl } from "../tierkreis_runtime";
import { RpcInterceptor } from "@protobuf-ts/runtime-rpc";

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
  const transport = new GrpcWebFetchTransport({
    baseUrl: runtimeUrl,
  });
  const tierkreis = new RuntimeClient(transport);

  useEffect(() => {
    const tk_graph = as_tierkreis_graph(graph);
    const request = {
      graph: tk_graph,
      typeCheck: true,
    };
    async function run() {
      try {
        const runResults = await tierkreis.runGraph(request).response;
        switch (runResults.result.oneofKind) {
          case "error":
            throw new Error(runResults.result.error);
          case "typeErrors":
            console.log(runResults.result.typeErrors.errors);
            break;
          case "success":
            const outputs = runResults.result.success;
            for (const cell of Object.values(cells)) {
              const output = outputs.map[cell.cellOutput];
              if (output) {
                if (output.value.oneofKind !== "str") {
                  throw new Error("Cell Output is not a string");
                }
                setStdinResponse({
                  cellId: cell.cellId as CellId,
                  response: output.value.str,
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

    const name: FunctionName = {
      namespaces: [],
      name: funcId,
    };

    cellIdtoIndex.set(cellId, index);

    return { name };
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
    return {
      portFrom: varName,
      portTo: varName,
      nodeFrom,
      nodeTo,
      edgeType: dataType,
    };
  });

  const toNode = (node: FunctionNode) => {
    const fn_wrap: { oneofKind: "function" } = { oneofKind: "function" };
    return {
      node: {
        function: node,
        ...fn_wrap,
      },
    };
  };

  return {
    nodes: fn_nodes.map(toNode),
    edges,
    name: "notebook",
    inputOrder: [],
    outputOrder: [],
  };
}
