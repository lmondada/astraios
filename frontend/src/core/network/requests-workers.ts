import { CompilationClient } from "@/protos/CompileServiceClientPb";
import { createNetworkRequests } from "./requests-network";
import { EditRequests, RunRequests } from "./types";
import { CompileRequest, CompileResponse } from "@/protos/compile_pb";
import { zip } from "lodash-es";
import { CellId } from "../cells/ids";
import { VariableName } from "../variables/types";

export function createWorkersRequests(): EditRequests & RunRequests {
  let requests = createNetworkRequests();

  // TODO: overwrite requests where useful (eventually everywhere?)
  requests.sendRun = async (cellIds, codes, options) => {
    if (!options) {
      console.error("No defined worker in workers runtime mode");
      return null;
    }
    const { handleResult, handleMessage } = options.handlers;
    const compilationClient = new CompilationClient(options.baseUrl);

    let request = new CompileRequest();
    request.setWorkerId(options.workerId);
    let cellContentsMap = request.getCellContentsMap();
    zip(cellIds, codes).forEach(([cellId, code]) => {
      cellContentsMap.set(cellId, code);
    });

    compilationClient
      .compile(request, {})
      .on("data", (response) => {
        // TODO: use proto types throughout!
        switch (response.getResponseCase()) {
          case CompileResponse.ResponseCase.RESULT:
            const result = response.getResult();
            if (result === undefined) {
              throw new Error("logic error");
            }
            const compiledFuncs = result.toObject();
            for (const [_, cell] of compiledFuncs.funcIdsMap) {
              const variables = cell.variablesMap.map(([ne, variable]) => {
                return {
                  name: variable.name as VariableName,
                  varType: variable.type,
                };
              });
              handleResult({
                cellId: cell.cellId as CellId,
                funcId: cell.funcId,
                inputs: cell.inputsList as VariableName[],
                outputs: cell.outputsList as VariableName[],
                variables,
              });
            }
            break;
          case CompileResponse.ResponseCase.STATUS:
            const status = response.getStatus();
            if (status === undefined) {
              throw new Error("logic error");
            }
            handleMessage(status.getStatus());
            break;
          case CompileResponse.ResponseCase.RESPONSE_NOT_SET:
            break;
        }
      })
      .on("error", (error) => {
        console.error(error);
      })
      .on("status", (status) => {
        console.log(status);
      });
    return null;
  };
  return requests;
}
