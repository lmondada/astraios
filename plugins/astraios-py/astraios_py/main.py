"""
Astraios Language Plugin for Python.
"""

from astraios_py.compile import CellContents, CompiledFn, compile_cell
from astraios_py.highlight import HighlightedToken, highlight
from astraios_py.metadata import metadata

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .worker import router as worker_router
from .config import ALLOWED_ORIGINS


app = FastAPI()
app.include_router(worker_router, prefix="/worker")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/compile")
def compile_post(cell: CellContents) -> CompiledFn:
    """
    Compile a cell of code and submit to a worker.
    """
    return compile_cell(cell)


@app.get("/highlight")
def highlight_get(cell: str) -> list[HighlightedToken]:
    """
    Highlight a cell of code
    """
    return highlight(cell)


@app.get("/metadata")
def metadata_get():
    """
    Get metadata about the language plugin
    """
    return metadata()
