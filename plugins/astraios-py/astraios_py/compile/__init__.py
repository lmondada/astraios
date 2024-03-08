""" Compile python code """

from pydantic import BaseModel
from .signature import Signature, ScopeSymbol, find_signature


class CompiledFn(BaseModel):
    """
    A compiled function
    """

    fn_id: str
    signature: Signature


class CellContents(BaseModel):
    """
    The contents of a code cell
    """

    code: str
    options: dict[str, str]
    scope: list[ScopeSymbol]


def compile_cell(cell: CellContents) -> CompiledFn:
    """
    Compile the code in a cell
    """
    sig = find_signature(cell.code, cell.scope)
    return CompiledFn(fn_id="add", signature=sig)
