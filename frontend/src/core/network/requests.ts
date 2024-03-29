/* Copyright 2024 Marimo. All rights reserved. */
import { RuntimeMode, getRuntimeMode } from "@/utils/runtimeMode";
import { PyodideBridge } from "../pyodide/bridge";
import { createNetworkRequests } from "./requests-network";
import { createStaticRequests } from "./requests-static";
import { createErrorToastingRequests } from "./requests-toasting";
import { EditRequests, RunRequests } from "./types";
import { createWorkersRequests } from "./requests-workers";

function getRequest() {
  let base: EditRequests & RunRequests;
  switch (getRuntimeMode()) {
    case RuntimeMode.Network:
      base = createNetworkRequests();
      break;
    case RuntimeMode.Pyodide:
      base = PyodideBridge.INSTANCE;
      break;
    case RuntimeMode.Static:
      base = createStaticRequests();
      break;
    case RuntimeMode.Workers:
      base = createWorkersRequests();
      break;
  }

  return createErrorToastingRequests(base);
}

export const {
  sendComponentValues,
  sendRename,
  sendRestart,
  sendSave,
  sendStdin,
  sendFormat,
  sendInterrupt,
  sendShutdown,
  sendRun,
  sendInstantiate,
  sendDeleteCell,
  sendCodeCompletionRequest,
  saveUserConfig,
  saveAppConfig,
  saveCellConfig,
  sendFunctionRequest,
  sendInstallMissingPackages,
  readCode,
  openFile,
  sendListFiles,
  sendCreateFileOrFolder,
  sendDeleteFileOrFolder,
  sendRenameFileOrFolder,
  sendFileDetails,
} = getRequest();
