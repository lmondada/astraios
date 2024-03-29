import React from "react";
import { workerSelectorAtom } from "./worker-selector";
import { useSetAtom } from "jotai";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "../inputs/Inputs";
import { CloudLightning } from "lucide-react";
import { renderShortcut } from "@/components/shortcuts/renderShortcut";

export const WorkerSelectorButton: React.FC = () => {
  const setWorkerSelectorOpen = useSetAtom(workerSelectorAtom);
  const toggle = () => setWorkerSelectorOpen((value) => !value);

  return (
    <Tooltip content={renderShortcut("global.workerSelector")}>
      <Button onClick={toggle} shape="rectangle" color="white">
        <CloudLightning strokeWidth={1.5} />
      </Button>
    </Tooltip>
  );
};
