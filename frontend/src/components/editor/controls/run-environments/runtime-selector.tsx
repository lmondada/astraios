import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { Runtime, useRuntimeActions } from "@/core/workers/tierkreis-runtime";
import { useRecentRuntimes } from "@/hooks/useRecentRuntimes";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createPromiseClient } from "@connectrpc/connect";
import { TempRuntime as RuntimeGrpc } from "@/protos/runtime_connect";
import { useConnectedWorkers } from "@/core/workers/state";

export const RuntimeSelector: React.FC = () => {
  // State to track the input field
  const inputState = useState("");

  const { recentRuntimes, deleteRecentRuntime, addRecentRuntime } =
    useRecentRuntimes();
  const connectedWorkers = useConnectedWorkers();

  // All connected runtimes
  const [runtimes, setRuntimes] = useState<Runtime[]>(recentRuntimes);
  // Queue of runtimes to connect
  const [connectingRuntimes, setConnectingRuntimes] = useState<
    { url: string }[]
  >([]);
  // Currently selected runtime (only non-local state)
  const { setRuntime: setSelectedRuntime, runtime: selectedRuntime } =
    useRuntimeActions();

  // When obtaining a fully formed runtime object (i.e has connected to backend):
  //  - set it as the selected runtime
  //  - if not already present, add it to the list of runtimes and put in local storage
  const selectRuntime = (runtime: Runtime) => {
    setSelectedRuntime(runtime);
    // Add it if not already present
    setRuntimes((prevRuntimes) => {
      if (!prevRuntimes.some((r) => r.url === runtime.url)) {
        // Add it to the recent runtimes for future ref
        addRecentRuntime(runtime);
        return [...prevRuntimes, runtime];
      }
      return prevRuntimes;
    });
  };

  // Pop connecting runtime, send requests and then push to (connected) runtimes
  useEffect(() => {
    if (connectingRuntimes.length > 0) {
      const newRuntime = connectingRuntimes[0];
      const transport = createConnectTransport({
        baseUrl: newRuntime.url,
        useBinaryFormat: true,
      });
      const runtimeClient = createPromiseClient(RuntimeGrpc, transport);
      if (connectedWorkers.length !== 0) {
        console.error(
          "Careful! We currently only support one connected worker",
        );
      }
      (async () => {
        const response = await runtimeClient.createRuntime({
          workerId: connectedWorkers[0].workerId,
        });
        console.log("runtime_id: ", response.runtimeId);
        selectRuntime({
          runtimeId: response.runtimeId,
          name: response.name,
          url: newRuntime.url,
        });
      })();
      // This always reduces the size of the queue, so whilst this hook will
      // recursively trigger itself, it will eventually clear the queue
      setConnectingRuntimes((prevRuntimes) => prevRuntimes.slice(1));
    }
  }, [connectingRuntimes]);

  const addConnectingRuntime = (url: string) => {
    setConnectingRuntimes((prevRuntimes) => {
      if (!connectingRuntimes.some((r) => r.url === url)) {
        return [...prevRuntimes, { url }];
      }
      return prevRuntimes;
    });
  };

  return intoHtml(
    runtimes,
    selectedRuntime,
    addConnectingRuntime,
    deleteRecentRuntime,
    inputState,
  );
};

function intoHtml(
  runtimes: Runtime[],
  selectedRuntime: Runtime,
  addRuntimeUrl: (url: string) => void,
  deleteRuntime: (url: string) => void,
  [inputField, setInputField]: [string, (value: string) => void],
) {
  const handleSelectRuntime = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == "Enter") {
      e.preventDefault();
      const url = inputField;
      if (url) {
        addRuntimeUrl(url);
        setInputField("");
        e.currentTarget.value = "";
      }
    }
  };
  return (
    <>
      {/* <CommandInput placeholder="Add worker (url)..." /> */}
      {/* This section should dynamically list active workers */}
      <ul className="menu-item relative cursor-default select-none items-center rounded-sm text-sm outline-none focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground">
        {/* Example static list item */}
        {runtimes.map((runtime) => {
          return (
            <RuntimeListItem
              runtime={runtime}
              selected={selectedRuntime.url === runtime.url}
              key={runtime.url}
              handleSelect={() => addRuntimeUrl(runtime.url)}
              handleDelete={() => deleteRuntime(runtime.url)}
            />
          );
        })}
      </ul>
      <input
        className="placeholder:text-foreground-muted flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="New runtime URL"
        onKeyDown={handleSelectRuntime}
        onChange={(e) => setInputField(e.target.value)}
      />
    </>
  );
}

type RuntimeListItemProp = {
  runtime: Runtime;
  handleSelect: () => void;
  handleDelete: () => void;
  selected: boolean;
};

const RuntimeListItem: React.FC<RuntimeListItemProp> = ({
  runtime,
  handleSelect,
  handleDelete,
  selected,
}: RuntimeListItemProp) => {
  return (
    <li
      className="flex justify-between items-center p-2 rounded-sm text-sm outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
      onClick={handleSelect}
    >
      <div>
        <div>{runtime.name}</div>
        <div className="italic">{runtime.url}</div>
      </div>
      {selected && (
        <Check
          size={15}
          strokeWidth={1.5}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        />
      )}
    </li>
  );
};
