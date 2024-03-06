import { useState } from 'react';
import Toolbar from './Toolbar';
import Main from './Main';

export type LangOptions = { [key: string]: string[] };

export interface LanguagePlugin {
  url: string,
  metadata: LangOptions,
  name: string,
  connectionState: "connecting" | "connected" | "failed",
}

function App() {
  const [plugins, setPlugins] = useState<LanguagePlugin[]>([]);

  return (
    <div className="flex justify-end">
      <Main plugins={plugins} />
      <Toolbar plugins={plugins} setPlugins={setPlugins} />
    </div>
  );
}

export default App;
