from astraios_py.compile import CellContents, CompiledFn, compile_cell
from astraios_py.highlight import HighlightedToken, highlight
from astraios_py.metadata import metadata

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/compile")
def compile_POST(cell: CellContents) -> CompiledFn:
    return compile_cell(cell)


@app.get("/highlight")
def highlight_GET(cell: str) -> list[HighlightedToken]:
    return highlight(cell)


@app.get("/metadata")
def metadata_GET():
    return metadata()


@app.put("/set_worker")
def set_worker_PUT(worker_url: str):
    app.worker = worker_url
