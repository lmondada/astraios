import { atom, useAtomValue, useSetAtom } from "jotai";
import DirectedGraph from "graphology";
import { VariableName, Variables } from "@/core/variables/types";
import { useVariablesActions } from "@/core/variables/state";
import { useEffect, useMemo } from "react";
import { CellId } from "@/core/cells/ids";
import { createReducer } from "@/utils/createReducer";
import { CompiledCell } from "@/protos/compile_pb";
import { Type } from "@/protos/tierkreis/graph_pb";
import { useTierkreisCodeExecution } from "./execution";

export type NodeAttrs = CompiledCell;
export type EdgeAttrs = { varName: VariableName; dataType: Type };
export type DFGraph = DirectedGraph<NodeAttrs, EdgeAttrs>;
const dataflowGraph = atom<DFGraph>(new DirectedGraph<NodeAttrs, EdgeAttrs>());
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

export function useDataflowGraph() {
  return useAtomValue(dataflowGraph);
}

/**
 * React hook to get the current scope of all but the given cell.
 *
 * @param cellId The cell id to exclude from the scope.
 * @returns The current scope of all but the given cell.
 */
export function useCurrentScope(cellId?: CellId): Record<string, Type> {
  const cells = useCompiledCells();
  return useMemo(() => {
    let scope: Record<string, Type> = {};
    for (const cell of Object.values(cells)) {
      if (cell.cellId !== cellId) {
        for (const varName of cell.outputs) {
          const varType = cell.variables[varName]?.type;
          if (!varType) {
            throw new Error(
              `Output ${varName} of cell ${cellId} is not defined`,
            );
          }
          scope[varName] = varType;
        }
      }
    }
    return scope;
  }, [cells, cellId]);
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
  useTierkreisCodeExecution();
  const setDataflowState = useSetAtom(dataflowGraph);
  const { setVariables } = useVariablesActions();
  const compiledCells = useCompiledCells();
  useEffect(() => {
    let g = new DirectedGraph<NodeAttrs, EdgeAttrs>();
    let variables: Variables = {};
    for (const cell of Object.values(compiledCells)) {
      const cellId = cell.cellId;
      g.addNode(cellId, cell);
      // Mark input variables as used in cellId
      for (const varInput of cell.inputs as VariableName[]) {
        const dataType = cell.variables[varInput]?.type;
        variables[varInput] = variables[varInput] || {
          name: varInput,
          declaredBy: [],
          usedBy: [],
          dataType,
        };
        variables[varInput].usedBy.push(cellId as CellId);
      }
      // Mark output variables as declared in cellId
      for (const varOutput of cell.outputs as VariableName[]) {
        const dataType = cell.variables[varOutput]?.type;
        variables[varOutput] = variables[varOutput] || {
          name: varOutput,
          declaredBy: [],
          usedBy: [],
          dataType,
        };
        variables[varOutput].declaredBy.push(cellId as CellId);
      }
    }
    for (const cell of Object.values(compiledCells)) {
      const usedByCell = cell.cellId;
      for (const varInput of cell.inputs as VariableName[]) {
        const variable = variables[varInput];
        for (const declaredByCell of variable.declaredBy) {
          g.addEdge(declaredByCell, usedByCell, {
            varName: varInput,
            dataType: variable.dataType,
          });
        }
      }
    }
    setDataflowState(g);
    setVariables(Object.values(variables));
  }, [compiledCells]);
}
