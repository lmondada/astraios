import { atom, useAtomValue } from "jotai";

const runtimeUrl = atom<string>("localhost:4444");

export function useRuntimeUrl() {
  return useAtomValue(runtimeUrl);
}
