import { useState, SetStateAction, Dispatch, useEffect } from "react";
import { LanguagePlugin } from "../App";

type PluginConnectionProps = {
  plugin: LanguagePlugin;
  deletePlugin: () => void;
  setPlugin: (
    name: string,
    workerUrls: string[],
    metadata: { [key: string]: string[] },
    connectionState: "connecting" | "connected" | "failed"
  ) => void;
};

function PluginConnection({
  plugin,
  deletePlugin,
  setPlugin,
}: PluginConnectionProps): JSX.Element {
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${plugin.url}/metadata`);
        let data = await response.json();
        let name = data.name;
        let workerUrls = data.supportedWorkers;
        if (name !== undefined && workerUrls !== undefined) {
          delete data.name;
          delete data.supportedWorkers;
          setPlugin(name, workerUrls, data, "connected");
        } else {
          setPlugin("Unknown", [], {}, "failed");
        }
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        setPlugin("Unknown", [], {}, "failed");
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
          onClick={deletePlugin}
        >
          X
        </button>{" "}
        {/* TODO: Implement remove plugin */}
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addPluginUpdateUrl();
          }
        }}
        placeholder="Add plugin URL"
      />
      <button onClick={addPluginUpdateUrl} className="w-1/4 rounded border-2">
        +
      </button>
    </div>
  );
}

type PluginManagerProps = {
  plugins: LanguagePlugin[];
  setPlugins: Dispatch<SetStateAction<LanguagePlugin[]>>;
};

export function PluginManager({ plugins, setPlugins }: PluginManagerProps) {
  const [workerCreators, setWorkerCreators] = useState<{
    [key: string]: { creators: string[]; name: string };
  }>({});
  const [liveWorkers, setLiveWorkers] = useState<{ [key: string]: string }>({});

  function deletePlugin(url: string) {
    setPlugins((plugins) => plugins.filter((plugin) => plugin.url !== url));
    setWorkerCreators((rest) => {
      delete rest[url];
      return rest;
    });
  }

  function setPlugin(
    url: string,
    name: string,
    workerUrls: string[],
    metadata: { [key: string]: string[] },
    connectionState: "connecting" | "connected" | "failed"
  ) {
    setPlugins((plugins) =>
      plugins.map((plugin) => {
        if (plugin.url === url) {
          return {
            ...plugin,
            name,
            metadata,
            connectionState,
          };
        } else {
          return plugin;
        }
      })
    );
    setWorkerCreators((rest) => ({
      ...rest,
      [url]: { creators: workerUrls, name },
    }));
  }

  function addPlugin(url: string) {
    if (plugins.some((plugin) => plugin.url === url)) {
      console.error("Plugin already exists");
      return;
    }
    setPlugins((plugins) => [
      ...plugins,
      {
        url,
        name: "Unknown",
        workerUrl: "",
        metadata: {},
        connectionState: "connecting",
      },
    ]);
  }

  function setWorkerUrl(url: string, workerUrl: string) {
    setPlugins((plugins) =>
      plugins.map((plugin) => {
        if (plugin.url === url) {
          return {
            ...plugin,
            workerUrl,
          };
        } else {
          return plugin;
        }
      })
    );
  }

  return (
    <div className="basis-1/5 p-2">
      <h1 className="font-serif">Plugin Manager</h1>
      <AddPluginConnection addPlugin={addPlugin} />
      <ul>
        {" "}
        {plugins.map((plugin) => (
          <li key={plugin.url}>
            <PluginConnection
              plugin={plugin}
              setPlugin={(name, workerUrls, metadata, connectionState) =>
                setPlugin(
                  plugin.url,
                  name,
                  workerUrls,
                  metadata,
                  connectionState
                )
              }
              deletePlugin={() => deletePlugin(plugin.url)}
            />
          </li>
        ))}
      </ul>
      <WorkerCreator
        setWorkerUrl={setWorkerUrl}
        workerCreators={workerCreators}
      />
    </div>
  );
}

type WorkerCreatorProps = {
  setWorkerUrl: (url: string, workerUrl: string) => void;
  workerCreators: { [key: string]: { creators: string[]; name: string } };
};
function WorkerCreator({ setWorkerUrl, workerCreators }: WorkerCreatorProps) {
  const [selectedLang, setSelectedLang] = useState(
    Object.keys(workerCreators)[0] ?? ""
  );
  const [selectedCreator, setSelectedCreator] = useState(
    workerCreators[selectedLang]?.creators
      ? Object.keys(workerCreators[selectedLang].creators)[0]
      : ""
  );
  const [allCreators, setAllCreators] = useState<string[]>([]);

  useEffect(() => {
    setSelectedLang(Object.keys(workerCreators)[0] ?? "");
  }, [workerCreators]);
  useEffect(() => {
    setSelectedCreator(
      workerCreators[selectedLang]?.creators
        ? workerCreators[selectedLang].creators[0]
        : ""
    );
  }, [selectedLang]);

  const createWorker = async () => {
    const response = await fetch(`${selectedCreator}/create`, {
      method: "POST",
    });
    const workerUrl = await response.json();
    setWorkerUrl(selectedLang, workerUrl);
    setAllCreators((allCreators) => [...allCreators, workerUrl]);
  };
  return Object.keys(workerCreators).length ? (
    <>
      <h1 className="font-serif mt-6">Workers</h1>
      <div className="border-2 border-black">
        <select
          value={Object.keys(workerCreators)[0]}
          onChange={(e) => setSelectedLang(e.target.value)}
        >
          {Object.keys(workerCreators).map((url) => (
            <option value={url} key={url}>
              {workerCreators[url].name}
            </option>
          ))}
        </select>
        {workerCreators[selectedLang] ? (
          <select
            value={workerCreators[selectedLang].creators[0]}
            onChange={(e) => setSelectedCreator(e.target.value)}
          >
            {workerCreators[selectedLang].creators.map((creator) => (
              <option value={creator} key={creator}>
                {creator}
              </option>
            ))}
          </select>
        ) : null}
        <button onClick={createWorker}>Create</button>
      </div>
      <div className="border-2 border-black">
        <ul>
          {allCreators.map((creator) => (
            <li key={creator}>{creator}</li>
          ))}
        </ul>
      </div>
    </>
  ) : null;
}
