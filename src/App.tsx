import { useState } from "react";
import Toolbar from "./Toolbar";
import Main from "./Main";

export type LangOptions = { [key: string]: string[] };
export type Signature = {
  inputs: { varName: string; varType: string }[];
  outputs: { varName: string; varType: string }[];
};

export interface LanguagePlugin {
  url: string;
  workerUrl: string;
  metadata: LangOptions;
  name: string;
  connectionState: "connecting" | "connected" | "failed";
}

export type Scope = { varName: string; varType: string; hintValue?: string }[];

function App() {
  const [plugins, setPlugins] = useState<LanguagePlugin[]>([]);
  const [scope, setScope] = useState<Scope>([]);

  return (
    <div className="flex justify-end">
      <Main plugins={plugins} scope={scope} setScope={setScope} />
      <Toolbar plugins={plugins} setPlugins={setPlugins} scope={scope} />
    </div>
  );
}

export default App;
