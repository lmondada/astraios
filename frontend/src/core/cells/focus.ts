/* Copyright 2024 Marimo. All rights reserved. */
import { atom } from "jotai";
import { CellId } from "./ids";
import { notebookAtom } from "./cells";
import { EditorView } from "@codemirror/view";
import { CellConfig, CellStatus } from "./types";

/**
 * Holds state for the last focused cell.
 */
export const lastFocusedCellIdAtom = atom<CellId | null>(null);

export const lastFocusedCellAtom = atom<{
  name: string;
  config: CellConfig;
  cellId: CellId;
  status: CellStatus;
  editorView: EditorView | null;
  hasOutput: boolean;
  workerId: string | null;
} | null>((get) => {
  const cellId = get(lastFocusedCellIdAtom);
  const { cellData, cellHandles, cellRuntime } = get(notebookAtom);
  if (!cellId) {
    return null;
  }
  const data = cellData[cellId];
  const runtime = cellRuntime[cellId];
  const handle = cellHandles[cellId].current;
  if (!data || !runtime || !handle) {
    return null;
  }

  return {
    cellId,
    name: data.name,
    config: data.config,
    status: runtime.status,
    editorView: handle.editorView,
    hasOutput: runtime.output !== null,
    workerId: data.workerId,
  };
});
