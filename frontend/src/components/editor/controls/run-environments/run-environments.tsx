import { HOTKEYS } from "@/core/hotkeys/hotkeys";
import { parseShortcut } from "@/core/hotkeys/shortcuts";
import { atom, useAtom } from "jotai";
import React from "react";

import * as Dg from "@radix-ui/react-dialog";
import { WorkerSelector } from "./worker-selector";
import { RuntimeSelector } from "./runtime-selector";

export const runEnvironmentsAtom = atom(false);

const TABS = ["Workers", "Runtime"] as const;
type TabType = (typeof TABS)[number];

export const RunEnvironments: React.FC = () => {
  const [open, setOpen] = useAtom(runEnvironmentsAtom);
  const [selectedTab, setSelectedTab] = React.useState<TabType>(TABS[0]);

  // Register hotkey to open the worker selector
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (parseShortcut(HOTKEYS.getHotkey("global.runEnvironments").key)(e)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

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
            <div className="flex justify-center gap-2 py-2">
              {TABS.map((tab) => {
                const isSelected = tab === selectedTab;
                return (
                  <button
                    className={`text-sm px-3 py-1 border ${isSelected ? "border-blue-500 text-blue-600 bg-blue-200" : "border-gray-300 text-gray-500 bg-white hover:bg-gray-100"} rounded-full focus:outline-none`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </button>
                );
              })}
              {/* <button className="text-sm px-3 py-1 border border-gray-300 rounded-full text-gray-500 bg-white hover:bg-gray-100 focus:border-blue-500 focus:bg-blue-200 focus:text-blue-600 focus:outline-none">
                Button 2
              </button> */}
            </div>
            {selectedTab === "Workers" ? (
              <WorkerSelector />
            ) : (
              <RuntimeSelector />
            )}
            <Dg.Description />
            <Dg.Close />
          </Dg.Content>
        </div>
      </Dg.Portal>
    </Dg.Root>
  );
};
