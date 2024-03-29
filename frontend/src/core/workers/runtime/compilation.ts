import { CompilationHandlers } from "@/core/network/types";
import { CompiledCell } from "./types";
import { useCompiledCellsActions, useUpdateDataflowGraph } from "./state";

export function useCompilationHandlers(): {
  handlers: CompilationHandlers<CompiledCell>;
} {
  useUpdateDataflowGraph();
  const { setCell } = useCompiledCellsActions();
  return {
    handlers: {
      handleMessage: (data) => {
        // TODO
        console.log(data);
      },
      handleResult: (data) => {
        setCell(data);
      },
    },
  };
}
