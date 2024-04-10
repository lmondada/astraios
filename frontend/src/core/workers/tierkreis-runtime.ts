import { atom, useAtomValue, useSetAtom } from "jotai";

export type Runtime = { url: string; name: string; runtimeId: string };
const runtime = atom<Runtime>({ url: "", name: "", runtimeId: "" });

export function useRuntime() {
  return useAtomValue(runtime);
}

export function useRuntimeActions() {
  const setter = useSetAtom(runtime);
  const value = useAtomValue(runtime);
  return { setRuntime: setter, runtime: value };
}
