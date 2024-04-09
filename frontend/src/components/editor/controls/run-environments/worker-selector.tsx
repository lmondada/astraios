import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import * as Dg from "@radix-ui/react-dialog";
import {
  useCreateWorkerConnection,
  useWorkers,
  useWorkersActions,
} from "@/core/workers/state";
import { RecentWorker, Worker } from "@/core/workers/types";
import { useRecentWorkers } from "@/hooks/useRecentWorkers";

export const WorkerSelector: React.FC = () => {
  // State to track the input field
  const inputState = useState("");

  // Hook to connect workers to remote and update metadata
  useCreateWorkerConnection();

  const { recentWorkers, deleteRecentWorker } = useRecentWorkers();

  const workers = useWorkers();
  const { createFromUrl, deleteWorker } = useWorkersActions();

  const createWorker = (url: string) => {
    createFromUrl(url);
  };

  return intoHTML(
    workers,
    recentWorkers,
    createWorker,
    deleteWorker,
    deleteRecentWorker,
    inputState,
  );
};

function intoHTML(
  workers: Worker[],
  recentWorkers: RecentWorker[],
  createWorker: (url: string) => void,
  deleteWorker: (url: string) => void,
  deleteRecentWorker: (url: string) => void,
  [newWorkerInputField, setNewWorkerInputField]: [
    string,
    (value: string) => void,
  ],
) {
  const handleCreateWorker = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == "Enter") {
      e.preventDefault();
      const url = newWorkerInputField;
      if (url) {
        createWorker(url);
        setNewWorkerInputField("");
        e.currentTarget.value = "";
      }
    }
  };

  return (
    <>
      <div className="flex items-center border-b px-3">
        <Plus className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className="placeholder:text-foreground-muted flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add worker (url)"
          onKeyDown={handleCreateWorker}
          onChange={(e) => setNewWorkerInputField(e.target.value)}
        />
      </div>
      {/* <CommandInput placeholder="Add worker (url)..." /> */}
      <Dg.DialogDescription className="overflow-hidden p-1 text-foreground px-1 py-1.5 text-xs font-medium text-muted-foreground">
        Active Workers
      </Dg.DialogDescription>
      {/* This section should dynamically list active workers */}
      <ul className="menu-item relative cursor-default select-none items-center rounded-sm px-1 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground">
        {/* Example static list item */}
        {Object.values(workers).map((worker) => {
          return (
            <WorkerListItem
              key={worker.url}
              worker={worker}
              handleDelete={() => {
                deleteWorker(worker.url);
              }}
            />
          );
        })}
      </ul>
      <Dg.DialogDescription className="overflow-hidden p-1 text-foreground px-1 py-1.5 text-xs font-medium text-muted-foreground">
        Recently Used Workers
      </Dg.DialogDescription>
      {/* This section should dynamically list recently used workers */}
      <ul className="menu-item relative cursor-default select-none items-center rounded-sm px-1 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground">
        {/* Example static list item */}
        {recentWorkers.map((worker) => {
          return (
            <WorkerListItem
              key={worker.url}
              worker={worker}
              handleDelete={() => {
                deleteRecentWorker(worker.url);
              }}
              handleClick={() => {
                createWorker(worker.url);
              }}
            />
          );
        })}
      </ul>
    </>
  );
}

type WorkerListItemProp = {
  worker: Worker;
  handleDelete: () => void;
  handleClick?: () => void;
};

const WorkerListItem: React.FC<WorkerListItemProp> = ({
  worker,
  handleDelete,
  handleClick,
}: WorkerListItemProp) => {
  let name: string;
  switch (worker.connectionStatus) {
    case "connected":
      name = worker.name;
      break;
    case "connecting":
      name = "Connecting...";
      break;
    case "failed":
      name = "Connection failed";
      break;
    case "recent":
      name = worker.name;
      break;
  }
  const pillColor = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    failed: "bg-red-500",
  };
  return (
    <li
      key={worker.url}
      className="flex justify-between items-center p-2 rounded-sm text-sm outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground group"
      onClick={handleClick}
    >
      <div>
        {name && <div>{name}</div>}
        <div className="italic">{worker.url}</div>
      </div>
      {worker.connectionStatus !== "recent" && (
        <div
          className={`h-2.5 w-2.5 rounded-full self-center ${pillColor[worker.connectionStatus]} group-hover:hidden`}
        ></div>
      )}
      <Trash2
        className="hidden group-hover:block hover:text-destructive"
        size={15}
        strokeWidth={1.5}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
      />
    </li>
  );
};
