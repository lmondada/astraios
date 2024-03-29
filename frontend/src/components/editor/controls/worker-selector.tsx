import { HOTKEYS } from "@/core/hotkeys/hotkeys";
import { parseShortcut } from "@/core/hotkeys/shortcuts";
import { atom, useAtom } from "jotai";
import React, { useState } from "react";
import { Plus } from "lucide-react";

import * as Dg from "@radix-ui/react-dialog";
import {
  useCreateWorkerConnection,
  useWorkers,
  useWorkersActions,
} from "@/core/workers/state";
import { Worker } from "@/core/workers/types";
import { useRecentWorkers } from "@/hooks/useRecentWorkers";

export const workerSelectorAtom = atom(false);

export const WorkerSelector: React.FC = () => {
  const [open, setOpen] = useAtom(workerSelectorAtom);

  // State to track the input field
  const inputState = useState("");

  // Hook to connect workers to remote and update metadata
  useCreateWorkerConnection();

  const { recentWorkers, addRecentWorker } = useRecentWorkers();

  const workers = useWorkers();
  const { createFromUrl } = useWorkersActions();

  for (const worker of recentWorkers) {
    createFromUrl(worker);
  }

  const createWorker = (url: string) => {
    addRecentWorker(url);
    createFromUrl(url);
  };

  // Register hotkey to open the worker selector
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (parseShortcut(HOTKEYS.getHotkey("global.workerSelector").key)(e)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  return intoHTML(workers, createWorker, open, setOpen, inputState);
};

function intoHTML(
  workers: Worker[],
  createWorker: (url: string) => void,
  open: boolean,
  setOpen: (open: boolean) => void,
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
    <Dg.Root open={open} onOpenChange={setOpen}>
      <Dg.Portal>
        <div
          className={
            "fixed inset-0 z-50 flex items-start justify-center sm:items-start sm:top-[15%]"
          }
        >
          <Dg.Overlay
            className={
              "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
            }
          />
          <Dg.Content
            className={
              "fixed z-50 grid w-full gap-4 rounded-b-lg border bg-background p-6 shadow-sm animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0"
            }
          >
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
                return <WorkerListItem key={worker.url} worker={worker} />;
              })}
            </ul>
            {/* <Dg.DialogDescription className="overflow-hidden p-1 text-foreground px-1 py-1.5 text-xs font-medium text-muted-foreground">
              Recently Used Workers
            </Dg.DialogDescription> */}
            {/* This section should dynamically list recently used workers */}
            {/* <ul className="menu-item relative cursor-default select-none items-center rounded-sm px-1 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground">
              {/* Example static list item */}
            {/* {recentWorkers.map((worker) => {
                return (
                  <WorkerListItem
                    key={worker}
                    worker={{ url: worker, connectionStatus: "connecting" }}
                  />
                );
              })} */}
            {/* </ul> */}
            <Dg.Description />
            <Dg.Close />
          </Dg.Content>
        </div>
      </Dg.Portal>
    </Dg.Root>
  );
}

type WorkerListItemProp = {
  worker: Worker;
};

const WorkerListItem: React.FC<WorkerListItemProp> = ({
  worker,
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
  }
  const pillColor = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    failed: "bg-red-500",
  };
  return (
    <li
      key={worker.url}
      className="flex justify-between items-center p-2 rounded-sm text-sm outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <div>
        <div>{name ?? "Connecting..."}</div>
        <div className="italic">{worker.url}</div>
      </div>
      <div
        className={`h-2.5 w-2.5 rounded-full self-center ${pillColor[worker.connectionStatus]}`}
      ></div>
    </li>
  );
};
