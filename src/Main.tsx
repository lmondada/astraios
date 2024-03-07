import {
  Dispatch,
  KeyboardEventHandler,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { LangOptions, LanguagePlugin, Signature } from "./App";
import Editor from "react-simple-code-editor";

type CellFn = {
  fnId: string;
  signature: Signature;
};

type CellProps = {
  setCellFn: (value: CellFn) => void;
  deleteCell: () => void;
  addCell: () => void;
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
  deleteCell,
  addCell,
  cellSignature,
  languages,
  scope,
}: CellProps) {
  let allLangNames = Object.keys(languages);
  if (!allLangNames.length) {
    allLangNames = [""];
  }

  const [langName, setLangName] = useState(allLangNames[0]);
  const [code, setCode] = useState(" ");
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
      e.preventDefault(); // Prevent the default action of enter key to avoid new line
      const url = languages[langName]?.url;
      if (url) {
        compileCode(url, code, langOpts, scope, setCellFn);
      }
      addCell();
    } else if (e.key === "Backspace" && code === "") {
      deleteCell();
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
        className="border-2 border-black font-mono text-sm"
      />
    </div>
  );
}

type MainProps = { plugins: LanguagePlugin[] };

type LanguageSettings = { url: string; metadata: LangOptions };
type Scope = { [key: string]: string };

export default function Main({ plugins }: MainProps) {
  let availableLangs = plugins
    .filter((plugin) => plugin.connectionState === "connected")
    .reduce((acc, plugin) => {
      return {
        ...acc,
        [plugin.name]: { url: plugin.url, metadata: plugin.metadata },
      };
    }, {} as { [key: string]: LanguageSettings });

  const [cells, setCells] = useState<(CellFn | null)[]>([null]);
  const [scope, setScope] = useState<Scope>({});

  const setCellFn = (index: number, newCell: CellFn) => {
    setCells((cells) => cells.map((cell, i) => (i === index ? newCell : cell)));
  };
  const deleteCell = (index: number) => {
    setCells((cells) => cells.filter((cell, i) => i !== index));
  };
  const addCell = (index: number) => {
    setCells((cells) => [
      ...cells.slice(0, index + 1),
      null,
      ...cells.slice(index + 1),
    ]);
  };
  return (
    <div className="basis-3/5">
      <h1 className="pt-4 font-serif text-2xl">New Notebook</h1>
      <div className="pt-3 mr-2">
        <ul>
          {cells.map((cell, index) => (
            <li key={index}>
              <Cell
                setCellFn={(cell) => setCellFn(index, cell)}
                deleteCell={index > 0 ? () => deleteCell(index) : () => {}}
                addCell={() => addCell(index)}
                cellSignature={cell?.signature}
                languages={availableLangs}
                scope={scope}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full flex justify-center">
        <button
          onClick={() => setCells([...cells, null])}
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
          <>
            <p className="mr-1 ml-2">{name}:</p>
            <select
              onChange={(e) =>
                setLangOpts((langOpts) => ({
                  ...langOpts,
                  [name]: e.target.value,
                }))
              }
            >
              {options.map((option) => (
                <option value={option}>{option}</option>
              ))}
            </select>
          </>
        );
      }
    );
  }
  return (
    <div className="flex">
      <p className="mr-1">Language:</p>
      <select onChange={(e) => setLangName(e.target.value)}>
        {allLangNames.map((lang) => (
          <option value={lang}>{lang}</option>
        ))}
      </select>
      {rowLangOptions.length && rowLangOptions}
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
