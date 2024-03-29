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
import { CompiledCell } from "@/core/workers/runtime/types";

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

  const runCells = useEvent(async (cellIds: CellId[]) => {
    if (cellIds.length === 0) {
      return;
    }

    const { cellHandles, cellData } = notebook;
    // TODO: this needs to be updated for each cell!
    let workerUrl: string | null = null;

    const codes: string[] = [];
    for (const cellId of cellIds) {
      if (workerUrl === null) {
        workerUrl = cellData[cellId].workerUrl;
      }
      const ref = derefNotNull(cellHandles[cellId]);
      codes.push(getEditorCodeAsPython(ref.editorView));
      ref.registerRun();
    }

    let opts: SendRunOptions<CompiledCell> | undefined;
    if (getRuntimeMode() == RuntimeMode.Workers) {
      opts = {
        ...useCompilationHandlers(),
        baseUrl: workerUrl,
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
