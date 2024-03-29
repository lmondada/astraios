import { isPyodide } from "@/core/pyodide/utils";
import { isStaticNotebook } from "@/core/static/static-state";

export enum RuntimeMode {
  Network = "Network",
  Static = "Static",
  Pyodide = "Pyodide",
  Workers = "Workers",
}

export function getRuntimeMode(): RuntimeMode {
  if (isPyodide()) {
    return RuntimeMode.Pyodide;
  }
  if (isStaticNotebook()) {
    return RuntimeMode.Static;
  }
  // TODO: switch between normal and workers mode
  return RuntimeMode.Workers;
}
