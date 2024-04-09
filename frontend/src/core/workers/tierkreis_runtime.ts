import { atom, useAtomValue, useSetAtom } from "jotai";

export type Runtime = { url: string };
const runtimeUrl = atom<Runtime>({ url: "" });

export function useRuntimeUrl() {
  return useAtomValue(runtimeUrl);
}

export function useRuntimeUrlActions() {
  const setter = useSetAtom(runtimeUrl);
  const value = useAtomValue(runtimeUrl);
  return { setRuntimeUrl: setter, runtimeUrl: value };
}
