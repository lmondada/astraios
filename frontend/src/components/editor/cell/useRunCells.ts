/* Copyright 2024 Marimo. All rights reserved. */
import { RuntimeState } from "@/core/kernel/RuntimeState";
import { CellId } from "@/core/cells/ids";
import { sendRun } from "@/core/network/requests";
import { staleCellIds, useNotebook } from "@/core/cells/cells";
import { derefNotNull } from "@/utils/dereference";
import useEvent from "react-use-event-hook";
import { getEditorCodeAsPython } from "@/core/codemirror/language/utils";
import { Logger } from "@/utils/Logger";
import { RuntimeMode, getRuntimeMode } from "@/utils/runtimeMode";
import { SendRunOptions } from "@/core/network/types";
import { useCompilationHandlers } from "@/core/workers/runtime/compilation";
import { useConnectedWorkers } from "@/core/workers/state";
import { useCurrentScope } from "@/core/workers/runtime/state";
import { CompiledCell } from "@/protos/compile";

/**
 * Creates a function that runs all cells that have been edited or interrupted.
 */
export function useRunStaleCells() {
  const notebook = useNotebook();
  const runCells = useRunCells();
  const runStaleCells = useEvent(() => runCells(staleCellIds(notebook)));
  return runStaleCells;
}

/**
 * Creates a function that runs the cell with the given id.
 */
export function useRunCell(cellId: CellId | undefined) {
  const runCells = useRunCells();
  const runCell = useEvent(() => {
    if (cellId === undefined) {
      return;
    }
    runCells([cellId]);
  });
  return runCell;
}

/**
 * Creates a function that runs the given cells.
 */
function useRunCells() {
  const notebook = useNotebook();
  const workers = useConnectedWorkers();
  const scope = useCurrentScope();

  const runCells = useEvent(async (cellIds: CellId[]) => {
    if (cellIds.length === 0) {
      return;
    }

    const { cellHandles, cellData } = notebook;
    // TODO: this needs to be updated for each cell!
    let workerUrl: string | null = null;
    let workerId: string | null = null;

    const codes: string[] = [];
    for (const cellId of cellIds) {
      const worker = workers.find(
        (w) => w.workerId === cellData[cellId].workerId,
      );
      if (workerUrl === null && worker) {
        workerUrl = worker.url;
        workerId = worker.workerId;
      }
      const ref = derefNotNull(cellHandles[cellId]);
      codes.push(getEditorCodeAsPython(ref.editorView));
      ref.registerRun();
    }

    let opts: SendRunOptions<CompiledCell> | undefined;
    if (getRuntimeMode() == RuntimeMode.Workers) {
      opts = {
        ...useCompilationHandlers(),
        baseUrl: workerUrl as string,
        workerId: workerId as string,
        scope,
      };
    }

    RuntimeState.INSTANCE.registerRunStart();
    await sendRun(cellIds, codes, opts).catch((error) => {
      Logger.error(error);
      RuntimeState.INSTANCE.registerRunEnd();
    });
  });

  return runCells;
}
