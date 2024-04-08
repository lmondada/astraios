import { createNetworkRequests } from "./requests-network";
import { EditRequests, RunRequests } from "./types";
import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Compilation } from "@/protos/compile_connect";

export function createWorkersRequests(): EditRequests & RunRequests {
  let requests = createNetworkRequests();

  // TODO: overwrite requests where useful (eventually everywhere?)
  requests.sendRun = async (cellIds, codes, options) => {
    if (!options) {
      console.error("No defined worker in workers runtime mode");
      return null;
    }
    const { handleResult, handleMessage } = options.handlers;

    const transport = createGrpcWebTransport({
      baseUrl: options.baseUrl,
    });
    const compilation = createPromiseClient(Compilation, transport);

    const cellContents = cellIds.reduce(
      (acc: Record<string, string>, cellId, index) => {
        acc[cellId as string] = codes[index];
        return acc;
      },
      {},
    );
    let incomingResponse = await compilation.compile({
      workerId: options.workerId,
      cellContents,
      scope: options.scope,
    });

    for await (const response of incomingResponse) {
      // TODO: use proto types throughout!
      switch (response.Response.case) {
        case "result":
          const compiledCells = response.Response.value;
          for (const cell of Object.values(compiledCells.cells)) {
            handleResult(cell);
          }
          break;
        case "status":
          const status = response.Response.value;
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
