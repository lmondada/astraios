import { createNetworkRequests } from "./requests-network";
import { EditRequests, RunRequests } from "./types";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { CompilationClient } from "@/protos/compile.client";
import { CompileResponse } from "@/protos/compile";

export function createWorkersRequests(): EditRequests & RunRequests {
  let requests = createNetworkRequests();

  // TODO: overwrite requests where useful (eventually everywhere?)
  requests.sendRun = async (cellIds, codes, options) => {
    if (!options) {
      console.error("No defined worker in workers runtime mode");
      return null;
    }
    const { handleResult, handleMessage } = options.handlers;

    const transport = new GrpcWebFetchTransport({
      baseUrl: options.baseUrl,
    });
    const compilation = new CompilationClient(transport);

    const cellContents = cellIds.reduce(
      (acc: Record<string, string>, cellId, index) => {
        acc[cellId as string] = codes[index];
        return acc;
      },
      {},
    );
    let compilationRequest = compilation.compile({
      workerId: options.workerId,
      cellContents,
      scope: options.scope,
    });

    for await (let responseUntyped of compilationRequest.responses) {
      const response = (responseUntyped as CompileResponse).response;
      // TODO: use proto types throughout!
      switch (response.oneofKind) {
        case "result":
          const compiledCells = response.result;
          for (const cell of Object.values(compiledCells.cells)) {
            handleResult(cell);
          }
          break;
        case "status":
          const status = response.status;
          handleMessage(status.status);
          break;
      }
    }
    return null;
  };
  requests.sendCodeCompletionRequest = async (request) => {
    return null;
  };

  return requests;
}
