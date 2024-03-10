import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { LangOptions, LanguagePlugin, Scope, Signature } from "./App";
import Editor from "react-simple-code-editor";
import { v4 as uuid } from "uuid";

type CellFn = {
  fnId: string;
  signature: Signature;
};

type CellProps = {
  setCellFn: (value?: CellFn) => void;
  setCellRef: (value: Editor) => void;
  onFocus: () => void;
  onBlur: () => void;
  deleteCell: () => void;
  moveNextCell: () => void;
  movePrevCell: () => void;
  cellSignature?: Signature;
  languages: { [key: string]: LanguageSettings };
  scope: Scope;
  setScope: Dispatch<SetStateAction<Scope>>;
};

function Cell({
  setCellFn,
  setCellRef,
  deleteCell,
  moveNextCell,
  movePrevCell,
  cellSignature,
  languages,
  scope,
  setScope,
  onFocus,
  onBlur,
}: CellProps) {
  let allLangNames = Object.keys(languages);
  if (!allLangNames.length) {
    allLangNames = [""];
  }

  const [langName, setLangName] = useState(allLangNames[0]);
  const [code, setCode] = useState("");
  const [highlightedCode, setHighlightedCode] = useState<ReactNode>(<></>);
  const [langOpts, setLangOpts] = useState<{ [key: string]: string }>({});
  const [errMsg, setErrMsg] = useState("");
  useEffect(() => {
    setLangName(allLangNames[0]);
  }, [allLangNames]);
  useEffect(() => {
    highlightCode(code);
  }, [code]);

  async function highlightCode(value: string) {
    const url = languages[langName]?.url;
    if (url) {
      try {
        const queryParams = new URLSearchParams({
          cell: value,
        });
        const data: { text: string; colour: number }[] = await fetch(
          `${url}/highlight?${queryParams}`,
          {
            method: "GET",
          }
        ).then((response) => response.json());
        const color_id = ["text-black", "text-red-600"];
        setHighlightedCode(
          data.map(({ text, colour }) => (
            <span className={color_id[colour]}>{text}</span>
          ))
        );
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(<p>{value}</p>);
      }
    } else {
      console.error("No URL found for language");
      setHighlightedCode(<p>{value}</p>);
    }
  }

  async function compileCode(url: string, workerUrl: string) {
    const oldOutputs = cellSignature?.outputs.map((output) => output.varName);
    const removeOldOutputs = (scope: Scope) =>
      scope.filter(({ varName }) => !oldOutputs?.includes(varName));
    const scope_minus_cell = removeOldOutputs(scope);
    setScope(removeOldOutputs);
    try {
      const response = await fetch(`${url}/compile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          workerUrl,
          options: langOpts,
          scope: scope_minus_cell,
        }),
      });
      switch (response.status) {
        case 200: {
          let data = await response.json();
          if (data.fnId && data.signature) {
            const { inputs: newInputs, outputs: newOutputs } =
              data.signature as Signature;
            // Check all inputs are in scope
            const missingVars = newInputs.filter(
              ({ varName, varType }) =>
                !scope.some((s) => s.varName == varName && s.varType == varType)
            );
            if (missingVars.length) {
              setErrMsg(
                `You are trying to use ${missingVars
                  .map(({ varName }) => varName)
                  .join(", ")}, but they are not defined`
              );
              data = undefined;
            }
            // Check all outputs are not in scope
            const overlap = newOutputs.filter(({ varName }) =>
              scope_minus_cell.some((s) => s.varName == varName)
            );
            if (overlap.length) {
              setErrMsg(
                `Cannot redefine: ${overlap
                  .map(({ varName }) => varName)
                  .join(", ")}`
              );
              data = undefined;
            }
            setCellFn(data);
            if (data) {
              setErrMsg("");
              setScope((scope) => [...scope, ...newOutputs]);
            }
          } else {
            setErrMsg("Received invalid response from plugin");
          }
          break;
        }
        case 400: {
          const data = await response.json();
          setErrMsg(data.detail);
          setCellFn(undefined);
          break;
        }
        default:
          setErrMsg("Received invalid response from plugin");
          setCellFn(undefined);
      }
    } catch (error) {
      console.error("Error compiling code:", error);
      setErrMsg("Could not compile");
    }
  }

  function handleKeyDownCell(
    e: React.KeyboardEvent<HTMLTextAreaElement> &
      React.KeyboardEvent<HTMLDivElement>
  ) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const url = languages[langName]?.url;
      const workerUrl = languages[langName]?.workerUrl;
      if (url && workerUrl) {
        compileCode(url, workerUrl);
        moveNextCell();
      } else {
        setErrMsg("No language selected");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      movePrevCell();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveNextCell();
    } else if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      e.preventDefault();
      const url = languages[langName]?.url;
      const workerUrl = languages[langName]?.workerUrl;
      if (url && workerUrl) {
        compileCode(url, workerUrl);
      } else {
        setErrMsg("No language selected");
      }
    } else if (e.key === "Backspace" && code === "") {
      e.preventDefault();
      deleteCell();
    } else if (e.key === "Backspace" && e.metaKey) {
      e.preventDefault();
      setCode("");
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 mt-2">
        <LangOptionsRow
          langName={langName}
          setLangName={setLangName}
          allLangNames={allLangNames}
          languages={languages}
          setLangOpts={setLangOpts}
        />
        {cellSignature && <SignatureRow signature={cellSignature} />}
      </div>
      <Editor
        value={code}
        onValueChange={setCode}
        highlight={(str) => highlightedCode}
        onKeyDown={handleKeyDownCell}
        padding={10}
        className="border-2 border-black font-mono text-sm min-h-12"
        onFocus={onFocus}
        onBlur={onBlur}
        ref={setCellRef}
      />
      <div
        className={errMsg ? "w-full bg-red-300 border-2 rounded" : "invisible"}
      >
        {errMsg}
      </div>
    </div>
  );
}

type MainProps = {
  plugins: LanguagePlugin[];
  scope: Scope;
  setScope: Dispatch<SetStateAction<Scope>>;
};

type LanguageSettings = {
  url: string;
  workerUrl: string;
  metadata: LangOptions;
};

export default function Main({ plugins, scope, setScope }: MainProps) {
  let availableLangs = plugins
    .filter((plugin) => plugin.connectionState === "connected")
    .reduce((acc, plugin) => {
      return {
        ...acc,
        [plugin.name]: {
          url: plugin.url,
          workerUrl: plugin.workerUrl,
          metadata: plugin.metadata,
        },
      };
    }, {} as { [key: string]: LanguageSettings });

  // States
  const [cells, setCells] = useState<{ id: string; fn?: CellFn }[]>([
    { id: uuid() },
  ]);
  const cellRefs = useRef<(Editor | null)[]>([null]);
  const [activeCell, setActiveCell] = useState<string | null>(cells[0].id);

  // Update active cell
  useEffect(() => {
    const activeCellIndex = cells.findIndex((cell) => cell.id === activeCell);
    const activeCellRef = cellRefs.current[activeCellIndex];
    activeCellRef?.focus();
  }, [activeCell, cells]);

  const setCellFn = (id: string, newCell?: CellFn) => {
    setCells((cells) =>
      cells.map((cell) => (cell.id === id ? { ...cell, fn: newCell } : cell))
    );
  };
  const setCellRef = (id: string, ref: Editor | null) => {
    const cellIndex = cells.findIndex((cell) => cell.id === id);
    cellRefs.current[cellIndex] = ref;
  };
  const deleteCell = (id: string) => {
    setCells((cells) => {
      const index = cells.findIndex((cell) => cell.id === id);
      if (index === 0) {
        return cells;
      } else {
        setActiveCell(cells[index - 1].id);
        return cells.filter((cell) => cell.id !== id);
      }
    });
  };
  const addCell = (id: string) => {
    setCells((cells) => {
      const index = cells.findIndex((cell) => cell.id === id);
      const new_cell = { id: uuid(), ref: null };
      setActiveCell(new_cell.id);
      return [
        ...cells.slice(0, index + 1),
        new_cell,
        ...cells.slice(index + 1),
      ];
    });
  };
  function moveNextCell(id: string) {
    const cellIndex = cells.findIndex((cell) => cell.id === id);
    if (cellIndex === cells.length - 1) {
      addCell(id);
    } else {
      setActiveCell(cells[cellIndex + 1].id);
    }
  }
  function movePrevCell(id: string) {
    const cellIndex = cells.findIndex((cell) => cell.id === id);
    if (cellIndex > 0) {
      setActiveCell(cells[cellIndex - 1].id);
    }
  }
  return (
    <div className="basis-3/5">
      <h1 className="pt-4 font-serif text-2xl">New Notebook</h1>
      <div className="pt-3 mr-2">
        <ul>
          {cells.map(({ id, fn }) => (
            <li key={id}>
              <Cell
                setCellFn={(cell) => setCellFn(id, cell)}
                setCellRef={(ref) => setCellRef(id, ref)}
                setScope={setScope}
                deleteCell={
                  id !== cells[0].id ? () => deleteCell(id) : () => {}
                }
                moveNextCell={() => moveNextCell(id)}
                movePrevCell={() => movePrevCell(id)}
                cellSignature={fn?.signature}
                languages={availableLangs}
                scope={scope}
                onFocus={() => setActiveCell(id)}
                onBlur={() => setActiveCell(null)}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full flex justify-center">
        <button
          onClick={() => addCell(cells[cells.length - 1].id)}
          className="border-1 border-slate-400 bg-slate-200 p-1 mt-2 hover:bg-slate-600"
        >
          Add Cell
        </button>
      </div>
    </div>
  );
}

type LangOptionsRowProps = {
  langName: string;
  setLangName: Dispatch<SetStateAction<string>>;
  allLangNames: string[];
  languages: { [key: string]: LanguageSettings };
  setLangOpts: Dispatch<SetStateAction<{ [key: string]: string }>>;
};

function LangOptionsRow({
  langName,
  setLangName,
  allLangNames,
  languages,
  setLangOpts,
}: LangOptionsRowProps) {
  let rowLangOptions: JSX.Element[] = [];
  if (languages[langName] !== undefined) {
    rowLangOptions = Object.entries(languages[langName].metadata).map(
      ([name, options]) => {
        return (
          <li key={name}>
            <span className="mr-1 ml-2">{name}:</span>
            <select
              onChange={(e) =>
                setLangOpts((langOpts) => ({
                  ...langOpts,
                  [name]: e.target.value,
                }))
              }
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </li>
        );
      }
    );
  }
  return (
    <div className="flex">
      <p className="mr-1">Language:</p>
      <select onChange={(e) => setLangName(e.target.value)}>
        {allLangNames.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      {rowLangOptions.length ? <ul>{rowLangOptions}</ul> : null}
    </div>
  );
}

function SignatureRow({ signature }: { signature: Signature }) {
  function printVarTypePair(vars: { varName: string; varType: string }[]) {
    return vars.map(({ varName, varType }) => {
      return (
        <>
          <span className="font-bold">{varName}</span>:{" "}
          <span className="italic">{varType} </span>
        </>
      );
    });
  }
  return (
    <div className="flex text-slate-500 text-sm">
      <div className="mr-4">
        {signature.inputs.length ? (
          <span>inputs: {printVarTypePair(signature.inputs)}</span>
        ) : (
          ""
        )}
      </div>
      <div>
        {signature.outputs.length ? (
          <span>outputs: {printVarTypePair(signature.outputs)}</span>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
