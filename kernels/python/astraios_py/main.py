"""
Astraios Language Plugin for Python.
"""

from astraios_py.config import ALLOWED_ORIGINS
from astraios_py.highlight import HighlightedToken, highlight
from astraios_py.worker import router as worker_router
from astraios_py.compile import router as compile_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.include_router(worker_router, prefix="/api/worker")
app.include_router(compile_router, prefix="/api/compile")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/highlight")
def highlight_get(cell: str) -> list[HighlightedToken]:
    """
    Highlight a cell of code
    """
    return highlight(cell)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "astraios_py.main:app",
        host="localhost",
        port=8000,
        log_level="info",
        reload=True,
    )
