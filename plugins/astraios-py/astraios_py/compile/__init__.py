""" Compile python code """

from typing import Annotated

from fastapi import HTTPException
from pydantic import BaseModel, AnyUrl, UrlConstraints

from .signature import Signature, ScopeSymbol, find_signature
from .codegen import as_tierkreis_function_str, random_function_name
from ..config import APP_BASE_URL
from ..worker import Worker


class CompiledFn(BaseModel):
    """
    A compiled function
    """

    fnId: str
    signature: Signature


class CellContents(BaseModel):
    """
    The contents of a code cell
    """

    code: str
    options: dict[str, str]
    scope: list[ScopeSymbol]
    workerUrl: Annotated[
        AnyUrl,
        UrlConstraints(default_host=APP_BASE_URL, allowed_schemes=["http", "https"]),
    ]


def compile_cell(cell: CellContents) -> CompiledFn:
    """
    Compile the code in a cell
    """
    sig = find_signature(cell.code, cell.scope)
    fn_name = random_function_name()
    worker = Worker.get_worker(cell.workerUrl)
    if not worker:
        raise HTTPException(status_code=500, detail="Worker not found")
    code = as_tierkreis_function_str(cell.code, sig, fn_name, worker.namespace)
    worker.add_fn(code)
    return CompiledFn(fnId=fn_name, signature=sig)
