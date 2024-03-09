import { Dispatch, SetStateAction, useState } from "react";
import { PluginManager } from "./toolbar/PluginManager";
import { FaCog as PluginIcon } from "react-icons/fa";
import { PiBracketsCurlyFill as ScopeViewerIcon } from "react-icons/pi";
import { FaDharmachakra as DAGIcon } from "react-icons/fa";
import { LanguagePlugin } from "./App";
import { Scope } from "./App";
import ScopeViewer from "./toolbar/ScopeViewer";

enum ToolEnum {
  PluginManager,
  ScopeViewer,
  Dag,
}

interface PluginManagerProps {
  kind: ToolEnum.PluginManager;
  setPlugins: Dispatch<SetStateAction<LanguagePlugin[]>>;
  plugins: LanguagePlugin[];
}

interface DagProps {
  kind: ToolEnum.Dag;
}

interface ScopeViewerProps {
  kind: ToolEnum.ScopeViewer;
  scope: Scope;
}

type Tool = PluginManagerProps | DagProps | ScopeViewerProps;

function toolToComponent(tool: Tool): JSX.Element | null {
  switch (tool.kind) {
    case ToolEnum.PluginManager:
      return <PluginManager {...tool} />;
    case ToolEnum.ScopeViewer:
      return <ScopeViewer {...tool} />;
    case ToolEnum.Dag:
      return <p>TODO: Dag</p>;
    default:
      return null;
  }
}

const ToolToIcon = {
  [ToolEnum.PluginManager]: PluginIcon,
  [ToolEnum.Dag]: DAGIcon,
  [ToolEnum.ScopeViewer]: ScopeViewerIcon,
};

function renderTool(tool: Tool | null): JSX.Element | null {
  if (tool === null) {
    return null;
  }
  return toolToComponent(tool);
}

function instantiateTool(
  tool: ToolEnum | null,
  props: ToolbarProps
): Tool | null {
  switch (tool) {
    case ToolEnum.PluginManager:
      return {
        kind: ToolEnum.PluginManager,
        setPlugins: props.setPlugins,
        plugins: props.plugins,
      };
    case ToolEnum.Dag:
      return { kind: ToolEnum.Dag };
    case ToolEnum.ScopeViewer:
      return { kind: ToolEnum.ScopeViewer, scope: props.scope };
    default:
      return null;
  }
}

type ToolbarProps = {
  plugins: LanguagePlugin[];
  setPlugins: Dispatch<SetStateAction<LanguagePlugin[]>>;
  scope: Scope;
};

export default function Toolbar(props: ToolbarProps) {
  const [currTool, setTool] = useState<ToolEnum | null>(null);

  const toggleTool = (tool: ToolEnum) => {
    if (currTool !== tool) {
      setTool(tool);
    } else {
      setTool(null);
    }
  };

  const toolButtons = Object.values(ToolEnum).map((tool) => {
    if (typeof tool !== "string") {
      const Icon = ToolToIcon[tool];
      const color = currTool === tool ? "bg-blue-400" : "bg-blue-200";
      return (
        <div className="my-1">
          <button
            key={tool}
            onClick={() => toggleTool(tool)}
            className={`rounded-sm ${color} border-2 border-blue-500 p-1 h-16 w-full hover:bg-blue-400 active:bg-blue-500`}
          >
            <Icon className="mx-auto" />
          </button>
        </div>
      );
    } else {
      return null;
    }
  });

  const renderedTool = renderTool(instantiateTool(currTool, props));
  return (
    <>
      <div className="w-16"></div>
      <div className="w-16 flex flex-col mt-10 fixed right-[20%] top-20">{toolButtons}</div>
      {renderedTool !== null ? (
        <div className="basis-1/5">{renderedTool}</div>
      ) : null}
    </>
  );
}
