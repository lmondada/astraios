from pydantic import BaseModel


class VarTypePair(BaseModel):
    var: str
    typ: str


class Signature(BaseModel):
    # inputs as var:type pairs
    inputs: list[VarTypePair]
    # outputs as var:type pairs
    outputs: list[VarTypePair]


class CompiledFn(BaseModel):
    fn_id: str
    signature: Signature


class CellContents(BaseModel):
    code: str
    options: dict[str, str]
    scope: list[VarTypePair]


def compile_cell(cell: CellContents) -> CompiledFn:
    sig = Signature(
        inputs=[VarTypePair(var="a", typ="int"), VarTypePair(var="b", typ="int")],
        outputs=[VarTypePair(var="c", typ="int")],
    )
    return CompiledFn(fn_id="add", signature=sig)
