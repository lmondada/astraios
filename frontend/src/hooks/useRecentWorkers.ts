/* Copyright 2024 Marimo. All rights reserved. */
import { RecentWorker } from "@/core/workers/types";
import { useLocalStorage } from "./useLocalStorage";

const MAX_RECENT_WORKERS = 3;

export function useRecentWorkers() {
  const [workers, setWorkers] = useLocalStorage<RecentWorker[]>(
    "marimo:workers",
    [],
  );

  return {
    recentWorkers: workers,
    addRecentWorker: (worker: RecentWorker) => {
      const uniqueWorkers = uniqueBy([worker, ...workers], (w) => w.url);
      setWorkers(uniqueWorkers.slice(0, MAX_RECENT_WORKERS));
    },
    deleteRecentWorker: (worker_url: string) => {
      setWorkers(workers.filter((w) => w.url !== worker_url));
    },
  };
}

export function uniqueBy<T, K>(xs: T[], key: (v: T) => K): T[] {
  const uniqueKeys = new Set<K>();
  const uniqueTs: T[] = [];
  xs.forEach((x) => {
    if (!uniqueKeys.has(key(x))) {
      uniqueKeys.add(key(x));
      uniqueTs.push(x);
    }
  });
  return uniqueTs;
}
