import { atom, useAtomValue, useSetAtom } from "jotai";
import { Worker, Workers, WorkersState } from "./types";
import { createReducer } from "@/utils/createReducer";
import { useEffect, useMemo } from "react";

function initialState(): WorkersState {
  return {
    workers: { connected: {}, connecting: {}, failed: {} },
    defaultWorker: null,
  };
}

// The worker atoms
const state = atom<WorkersState>(initialState());

const workersAtom = atom((get) => get(state).workers);
const defaultWorkerIdAtom = atom((get) => get(state).defaultWorker);
const connectedWorkersAtom = atom((get) => get(workersAtom).connected);
const connectingWorkersAtom = atom((get) => get(workersAtom).connecting);
// const failedWorkersAtom = atom((get) => get(workersAtom).failed);

function flattenWorkerUrls(workers: Workers) {
  return flattenWorkers(workers).map((worker) => worker.url);
}

function flattenWorkers(workers: Workers): Worker[] {
  return Object.values(workers)
    .map((worker: Record<string, Worker>) => Object.values(worker))
    .flat();
}

function workerUrlExists(workers: Workers, url: string) {
  return flattenWorkerUrls(workers).some((workerUrl) => workerUrl === url);
}

export const useWorkers = () => {
  const workers = useAtomValue(workersAtom);
  return useMemo(() => flattenWorkers(workers), [workers]);
};
export const useConnectedWorkers = () => {
  const workers = useAtomValue(connectedWorkersAtom);
  return Object.values(workers);
};
export const useConnectingWorkers = () => {
  const workers = useAtomValue(connectingWorkersAtom);
  return Object.values(workers);
};
export const useDefaultWorkerId: () => string | null = () =>
  useAtomValue(defaultWorkerIdAtom);

const { reducer, createActions } = createReducer(initialState, {
  createFromUrl: (state, url: string) => {
    if (!url.endsWith("/")) {
      url = url + "/";
    }
    if (workerUrlExists(state.workers, url)) {
      return state;
    } else {
      return {
        ...state,
        workers: {
          ...state.workers,
          connecting: {
            ...state.workers.connecting,
            [url]: { url, connectionStatus: "connecting" },
          },
        },
      };
    }
  },
  setWorkerConnected: (
    state,
    { url, name, workerId }: { url: string; name: string; workerId: string },
  ) => {
    let workers = { ...state.workers };
    if (workers.connecting[url]) {
      workers.connected[url] = {
        ...workers.connecting[url],
        connectionStatus: "connected",
        name,
        workerId,
      };
      delete workers.connecting[url];
    }
    const newState = { ...state, workers };
    return newState;
  },
  setWorkerFailed: (state, { url }: { url: string }) => {
    let workers = { ...state.workers };
    if (workers.connecting[url]) {
      workers.failed[url] = {
        ...workers.connecting[url],
        connectionStatus: "failed",
      };
      delete workers.connecting[url];
    }
    const newState = { ...state, workers };
    return newState;
  },
  setDefaultWorkerIfNull: (state, newDefaultId: string) => {
    if (!state.defaultWorker) {
      return { ...state, defaultWorker: newDefaultId };
    }
    return state;
  },
});

/**
 * React hook to get the workers actions.
 */
export function useWorkersActions() {
  const setState = useSetAtom(state);
  return useMemo(() => {
    const actions = createActions((action) => {
      setState((state) => reducer(state, action));
    });
    return actions;
  }, [setState]);
}

/**
 * React hook to fetch and update the worker metadata.
 */
export function useCreateWorkerConnection() {
  const connectingWorkers = useConnectingWorkers();
  const { setWorkerConnected, setWorkerFailed, setDefaultWorkerIfNull } =
    useWorkersActions();

  useEffect(() => {
    // AbortController to cancel the fetch requests at unmount
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchAndUpdateWorkerConnection = async (url: string) => {
      try {
        const response = await fetch(`${url}api/worker/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
          signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as {
          name?: string;
          workerId?: string;
        };
        if (data && data.name && data.workerId) {
          console.log("set worker connected");
          setWorkerConnected({ url, workerId: data.workerId, name: data.name });
          setDefaultWorkerIfNull(data.workerId);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          // Don't log abort errors
          console.error("Failed to fetch worker metadata:", error);
          setWorkerFailed({ url });
        }
      }
    };

    connectingWorkers.forEach((worker) => {
      fetchAndUpdateWorkerConnection(worker.url);
    });

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [connectingWorkers]);
}
