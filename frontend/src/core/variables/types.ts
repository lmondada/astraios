/* Copyright 2024 Marimo. All rights reserved. */

import { CellId } from "../cells/ids";
import { TypedString } from "../../utils/typed";
import { Type } from "@/protos/tierkreis/graph";

export type VariableName = TypedString<"VariableName">;

export interface Variable {
  name: VariableName;
  declaredBy: CellId[];
  usedBy: CellId[];
  /**
   * String representation of the value.
   */
  value?: string;
  /**
   * Type of the value.
   */
  dataType: Type;
}

export type Variables = Record<VariableName, Variable>;
