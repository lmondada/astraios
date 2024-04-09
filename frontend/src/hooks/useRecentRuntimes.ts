/* Copyright 2024 Marimo. All rights reserved. */
import { useLocalStorage } from "./useLocalStorage";
import { uniqueBy } from "./useRecentWorkers";

const MAX_RECENT_RUNTIMES = 3;

export function useRecentRuntimes() {
  const [runtimes, setRuntimes] = useLocalStorage<{ url: string }[]>(
    "marimo:runtimes",
    [],
  );

  return {
    recentRuntimes: runtimes,
    addRecentRuntime: (runtime: { url: string }) => {
      const uniqueRuntimes = uniqueBy([runtime, ...runtimes], (w) => w.url);
      setRuntimes(uniqueRuntimes.slice(0, MAX_RECENT_RUNTIMES));
    },
    deleteRecentRuntime: (runtime_url: string) => {
      setRuntimes(runtimes.filter((w) => w.url !== runtime_url));
    },
  };
}
