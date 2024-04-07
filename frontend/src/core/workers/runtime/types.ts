import { CellId } from "@/core/cells/ids";
import { VariableName } from "@/core/variables/types";
import { Variable } from "@/protos/compile";

export interface CompiledCell {
  funcId: string;
  cellId: CellId;
  inputs: VariableName[];
  outputs: VariableName[];
  variables: Variable[];
}
