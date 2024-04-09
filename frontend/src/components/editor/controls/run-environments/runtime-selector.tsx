import React, { useState } from "react";
import { Check } from "lucide-react";

import {
  Runtime,
  useRuntimeUrlActions,
} from "@/core/workers/tierkreis_runtime";
import { useRecentRuntimes } from "@/hooks/useRecentRuntimes";

export const RuntimeSelector: React.FC = () => {
  // State to track the input field
  const inputState = useState("");

  const { recentRuntimes, deleteRecentRuntime, addRecentRuntime } =
    useRecentRuntimes();

  const { setRuntimeUrl, runtimeUrl } = useRuntimeUrlActions();

  const addRuntimeUrl = (url: string) => {
    if (!recentRuntimes.some((r) => r.url === url)) {
      addRecentRuntime({ url });
    }
    setRuntimeUrl({ url });
  };

  return intoHtml(
    recentRuntimes,
    runtimeUrl,
    addRuntimeUrl,
    deleteRecentRuntime,
    inputState,
  );
};

function intoHtml(
  runtimes: { url: string }[],
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
  runtime: { url: string };
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
      <div className="italic">{runtime.url}</div>
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
