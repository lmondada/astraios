export interface Workers {
  connected: Record<Worker["url"], ConnectedWorker>;
  connecting: Record<Worker["url"], ConnectingWorker>;
  failed: Record<Worker["url"], FailedWorker>;
}

export interface WorkersState {
  workers: Workers;
  defaultWorker: string | null;
}

export type Worker = ConnectedWorker | ConnectingWorker | FailedWorker;

export interface ConnectedWorker {
  name: string;
  workerId: string;
  url: string;
  connectionStatus: "connected";
}

export interface ConnectingWorker {
  connectionStatus: "connecting";
  url: string;
}

export interface FailedWorker {
  connectionStatus: "failed";
  url: string;
}
