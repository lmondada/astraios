import { useState, SetStateAction, Dispatch, useEffect } from "react";
import { LanguagePlugin } from "./App";


type PluginConnectionProps = {
  plugin: LanguagePlugin,
  deletePlugin: () => void,
  setPlugin: (
    name: string,
    metadata: { [key: string]: string[] },
    connectionState: "connecting" | "connected" | "failed"
  ) => void
};

function PluginConnection({ plugin, deletePlugin, setPlugin }: PluginConnectionProps): JSX.Element {
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${plugin.url}/metadata`);
        let data = await response.json();
        let name = data.name;
        if (name !== undefined) {
          delete data.name;
          setPlugin(name, data, "connected");
        } else {
          setPlugin("Unknown", {}, "failed");
        }
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        setPlugin("Unknown", {}, "failed");
      }
    };

    fetchMetadata();
  }, [plugin.url]);

  const getName = () => {
    switch (plugin.connectionState) {
      case "connecting":
        return <h2>Connecting...</h2>;
      case "connected":
        return <h2>{plugin.name}</h2>;
      case "failed":
        return <h2 className="text-red-600">Failed to connect</h2>;
    }
  };

  return (
    <div className="group flex p-2 border-2 border-slate-300 rounded my-2 items-center">
      <div className="flex-auto">
        {getName()}
        <p className="italic text-sm">{plugin.url}</p>
      </div>
      <div className="invisible group-hover:visible">
        <button
          className="w-8 h-8 bg-red-100 hover:bg-red-600 rounded-full text-white font-bold"
          onClick={deletePlugin}>X</button> {/* TODO: Implement remove plugin */}
      </div>
    </div>
  );
}


type AddPluginConnectionProps = { addPlugin: (url: string) => void };

function AddPluginConnection({ addPlugin }: AddPluginConnectionProps) {
  const [newPluginUrl, setNewPluginUrl] = useState("");

  const addPluginUpdateUrl = () => {
    if (newPluginUrl) {
      addPlugin(newPluginUrl);
      setNewPluginUrl("");
    }
  };

  return (
    <div>
      <input
        type="text"
        className="w-3/4 pr-1 border-2"
        value={newPluginUrl}
        onChange={(e) => setNewPluginUrl(e.target.value)}
        placeholder="Add plugin URL"
      />
      <button onClick={addPluginUpdateUrl} className="w-1/4 rounded border-2">+</button>
    </div>
  );

}

type PluginManagerProps = {
  plugins: LanguagePlugin[],
  setPlugins: Dispatch<SetStateAction<LanguagePlugin[]>>
};

export function PluginManager({ plugins, setPlugins }: PluginManagerProps) {
  function deletePlugin(url: string) {
    setPlugins(plugins => plugins.filter(plugin => plugin.url !== url));
  }

  function setPlugin(url: string, name: string, metadata: { [key: string]: string[] }, connectionState: "connecting" | "connected" | "failed") {
    setPlugins(plugins => plugins.map(plugin => {
      if (plugin.url === url) {
        return { ...plugin, name, metadata, connectionState };
      } else {
        return plugin;
      }
    }));
  }


  function addPlugin(url: string) {
    if (plugins.some(plugin => plugin.url === url)) {
      console.error("Plugin already exists");
      return;
    }
    setPlugins(plugins => [...plugins, {
      url,
      name: "Unknown",
      metadata: {},
      connectionState: "connecting"
    }]);
  }

  return (
    <div className="basis-1/5 p-2">
      <h1 className="font-serif">Plugin Manager</h1>
      <AddPluginConnection addPlugin={addPlugin} />
      <ul> {plugins.map((plugin) =>
        <li key={plugin.url}>
          <PluginConnection
            plugin={plugin}
            setPlugin={(name, metadata, connectionState) => setPlugin(plugin.url, name, metadata, connectionState)}
            deletePlugin={() => deletePlugin(plugin.url)} />
        </li>)}
      </ul>
    </div>
  );
}