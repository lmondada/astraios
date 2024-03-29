/* Copyright 2024 Marimo. All rights reserved. */
import { useLocalStorage } from "./useLocalStorage";

const MAX_RECENT_COMMANDS = 3;
type RecentWorkerUrl = string;

export function useRecentWorkers() {
  const [workers, setWorkers] = useLocalStorage<RecentWorkerUrl[]>(
    "marimo:workers",
    [],
  );

  return {
    recentWorkers: workers,
    addRecentWorker: (worker: RecentWorkerUrl) => {
      const uniqueWorkers = unique([worker, ...workers]);
      setWorkers(uniqueWorkers.slice(0, MAX_RECENT_COMMANDS));
    },
  };
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
