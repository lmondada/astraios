import { useEffect, useState } from "react";
import { LangOptions, LanguagePlugin } from "./App";

type CellProps = {
    id: string,
    content: string
    langOptions: { [key: string]: LangOptions },
};

function Cell({ id, content, langOptions }: CellProps) {
    let langs = Object.keys(langOptions);
    if (!langs.length) {
        langs = [""];
    }
    const [lang, setLang] = useState(langs[0]);
    useEffect(() => {
        setLang(langs[0]);
    }, [langs]);
    const [langOpts, setLangOpts] = useState<{ [key: string]: string }>({});

    let rowLangOptions: JSX.Element[] = [];
    if (langOptions[lang] !== undefined) {
        rowLangOptions = Object.entries(langOptions[lang]).map(([name, options]) => {
            return <>
                <p className="mr-1 ml-2">{name}:</p>
                <select onChange={(e) => setLangOpts({ ...langOpts, [name]: e.target.value })}>
                    {options.map((option) => <option value={option}>{option}</option>)}
                </select>
            </>;
        });
    }
    return <div className="w-full">
        <div className="flex">
            <p className="mr-1">Language:</p>
            <select onChange={e => setLang(e.target.value)}>
                {langs.map((lang) => <option value={lang}>{lang}</option>)}
            </select>
            {(rowLangOptions.length) ? rowLangOptions : null}
        </div>
        <textarea
            className="my-2 border-2 border-slate-300 rounded w-full h-16"
            value={content} />
    </div>
}

type MainProps = { plugins: LanguagePlugin[] };

export default function Main({ plugins }: MainProps) {
    let langOptions: { [key: string]: LangOptions } = plugins.reduce((acc, plugin) => {
        return { ...acc, [plugin.name]: plugin.metadata };
    }, {});
    let cells = [{
        id: "1",
        content: "Hello",
    }];
    return <div className="basis-3/5">
        <h1 className="pt-4 font-serif text-2xl">New Notebook</h1>
        <div className="pt-3 mr-2">
            <ul>
                <li></li>
            </ul>
            {cells.map((cell) => <Cell {...cell} langOptions={langOptions} />)}
        </div>
    </div>
}