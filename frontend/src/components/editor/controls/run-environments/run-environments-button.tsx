import React from "react";
import { runEnvironmentsAtom } from "./run-environments";
import { useSetAtom } from "jotai";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "../../inputs/Inputs";
import { CloudLightning } from "lucide-react";
import { renderShortcut } from "@/components/shortcuts/renderShortcut";

export const RunEnvironmentsButton: React.FC = () => {
  const setRunEnvironmentsOpen = useSetAtom(runEnvironmentsAtom);
  const toggle = () => setRunEnvironmentsOpen((value) => !value);

  return (
    <Tooltip content={renderShortcut("global.runEnvironments")}>
      <Button onClick={toggle} shape="rectangle" color="white">
        <CloudLightning strokeWidth={1.5} />
      </Button>
    </Tooltip>
  );
};
