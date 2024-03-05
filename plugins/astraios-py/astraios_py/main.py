from typing import Union

from astraios_py.compile import CellContents, CompiledFn, compile
from astraios_py.highlight import HighlightedText, highlight
from astraios_py.metadata import metadata

from fastapi import FastAPI

app = FastAPI()


@app.post("/compile")
def compile_POST(cell: CellContents) -> CompiledFn:
    return compile(cell)


@app.get("/highlight")
def highlight_GET(cell: str) -> HighlightedText:
    return highlight(cell)


@app.get("/metadata")
def metadata_GET():
    return metadata()


@app.put("/set_worker")
def set_worker_PUT(worker_url: str):
    app.worker = worker_url
