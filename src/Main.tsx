import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { LangOptions, LanguagePlugin, Signature } from "./App";
import Editor from "react-simple-code-editor";
import { v4 as uuid } from "uuid";

type CellFn = {
  fnId: string;
  signature: Signature;
};

type CellProps = {
  setCellFn: (value: CellFn) => void;
  setCellRef: (value: Editor) => void;
  onFocus: () => void;
  onBlur: () => void;
  deleteCell: () => void;
  moveNextCell: () => void;
  movePrevCell: () => void;
  cellSignature?: Signature;
  languages: { [key: string]: LanguageSettings };
  scope: Scope;
};

async function compileCode(
  url: string,
  code: string,
  langOpts: { [key: string]: string },
  scope: Scope,
  setCellFn: (value: CellFn) => void
) {
  try {
    const response = await fetch(`${url}/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        options: langOpts,
        scope: scope,
      }),
    });
    const data = await response.json();
    if (data.fn_id && data.signature) {
      setCellFn(data);
    } else {
      console.error("Function ID not received");
    }
  } catch (error) {
    console.error("Error compiling code:", error);
  }
}

function Cell({
  setCellFn,
  setCellRef,
  deleteCell,
  moveNextCell,
  movePrevCell,
  cellSignature,
  languages,
  scope,
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

  function handleKeyDownCell(
    e: React.KeyboardEvent<HTMLTextAreaElement> &
      React.KeyboardEvent<HTMLDivElement>
  ) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const url = languages[langName]?.url;
      if (url) {
        compileCode(url, code, langOpts, scope, setCellFn);
      }
      moveNextCell();
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
      if (url) {
        compileCode(url, code, langOpts, scope, setCellFn);
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
    </div>
  );
}

type MainProps = { plugins: LanguagePlugin[] };

type LanguageSettings = { url: string; metadata: LangOptions };
type Scope = { varName: string; varType: string; hintValue?: string }[];

export default function Main({ plugins }: MainProps) {
  let availableLangs = plugins
    .filter((plugin) => plugin.connectionState === "connected")
    .reduce((acc, plugin) => {
      return {
        ...acc,
        [plugin.name]: { url: plugin.url, metadata: plugin.metadata },
      };
    }, {} as { [key: string]: LanguageSettings });

  // States
  const [cells, setCells] = useState<{ id: string; fn?: CellFn }[]>([
    { id: uuid() },
  ]);
  const cellRefs = useRef<(Editor | null)[]>([null]);
  const [scope, setScope] = useState<Scope>([]);
  const [activeCell, setActiveCell] = useState<string | null>(cells[0].id);

  // Update active cell
  useEffect(() => {
    const activeCellIndex = cells.findIndex((cell) => cell.id === activeCell);
    const activeCellRef = cellRefs.current[activeCellIndex];
    activeCellRef?.focus();
  }, [activeCell, cells]);

  const setCellFn = (id: string, newCell: CellFn) => {
    setCells((cells) =>
      cells.map((cell) => (cell.id === id ? { ...cell, fn: newCell } : cell))
    );
    setScope((scope) => {
      const outputVars = newCell.signature.outputs.map(
        (output) => output.varName
      );
      const scopeVars = scope.map((scopeItem) => scopeItem.varName);
      const overlap = outputVars.some((varName) => scopeVars.includes(varName));
      if (!overlap) {
        return [...scope, ...newCell.signature.outputs];
      } else {
        console.log("Scope overlap detected, not adding new vars to scope");
        return scope;
      }
    });
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
      {rowLangOptions.length && <ul>{rowLangOptions}</ul>}
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
      <div className="mr-4">inputs: {printVarTypePair(signature.inputs)}</div>
      <div>outputs: {printVarTypePair(signature.outputs)}</div>
    </div>
  );
}
