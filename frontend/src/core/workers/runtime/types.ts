import { CellId } from "@/core/cells/ids";
import { VariableName } from "@/core/variables/types";

type VarType = string;

export interface CompiledCell {
  funcId: string;
  cellId: CellId;
  inputs: VariableName[];
  outputs: VariableName[];
  variables: {
    name: VariableName;
    varType: VarType;
  }[];
}
