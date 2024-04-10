import { CompilationHandlers } from "@/core/network/types";
import { useCompiledCellsActions, useUpdateDataflowGraph } from "./state";
import { CompiledCell } from "@/protos/compile_pb";

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
        console.log(data);
        setCell(data);
      },
    },
  };
}
