import { atom, useAtomValue, useSetAtom } from "jotai";
import Graph from "graphology";
import { CompiledCell } from "./types";
import { Variables } from "@/core/variables/types";
import { useVariables, useVariablesActions } from "@/core/variables/state";
import { useEffect, useMemo } from "react";
import { useCellIds } from "@/core/cells/cells";
import { CellId } from "@/core/cells/ids";
import { createReducer } from "@/utils/createReducer";

const dataflowGraph = atom<Graph>(new Graph());
const compiledCells = atom<Record<CellId, CompiledCell>>({});

function initialState(): Record<CellId, CompiledCell> {
  return {};
}

const { reducer, createActions } = createReducer(initialState, {
  setCell: (state, cell: CompiledCell) => {
    return {
      ...state,
      [cell.cellId]: cell,
    };
  },
});

/**
 * React hook to get the compiled cells.
 */
export function useCompiledCells() {
  return useAtomValue(compiledCells);
}

/**
 * React hook to get the workers actions.
 */
export function useCompiledCellsActions() {
  const setState = useSetAtom(compiledCells);
  return useMemo(() => {
    const actions = createActions((action) => {
      setState((state) => reducer(state, action));
    });
    return actions;
  }, [setState]);
}

/**
 * React hook to update the dataflow graph whenever the compiled cells change.
 */
export function useUpdateDataflowGraph() {
  const setDataflowState = useSetAtom(dataflowGraph);
  const { setVariables } = useVariablesActions();
  const compiledCells = useCompiledCells();
  useEffect(() => {
    let g = new Graph();
    let variables: Variables = {};
    for (const cell of Object.values(compiledCells)) {
      const cellId = cell.cellId;
      g.addNode(cellId, cell);
      // Mark input variables as used in cellId
      for (const varInput of cell.inputs) {
        variables[varInput] = variables[varInput] || {
          name: varInput,
          declaredBy: [],
          usedBy: [],
        };
        variables[varInput].usedBy.push(cellId);
      }
      // Mark output variables as declared in cellId
      for (const varOutput of cell.outputs) {
        variables[varOutput] = variables[varOutput] || {
          name: varOutput,
          declaredBy: [],
          usedBy: [],
        };
        variables[varOutput].declaredBy.push(cellId);
      }
    }
    for (const cell of Object.values(compiledCells)) {
      const usedByCell = cell.cellId;
      for (const varInput of cell.inputs) {
        const variable = variables[varInput];
        for (const declaredByCell of variable.declaredBy) {
          g.addEdge(declaredByCell, usedByCell);
        }
      }
    }
    setDataflowState(g);
    setVariables(Object.values(variables));
  }, [compiledCells]);
}
