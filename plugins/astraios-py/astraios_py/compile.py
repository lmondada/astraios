from pydantic import BaseModel


class VarTypePair(BaseModel):
    varName: str
    varType: str


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
    scope: dict[str, str]


def compile_cell(cell: CellContents) -> CompiledFn:
    sig = Signature(
        inputs=[VarTypePair(varName="a", varType="int"), VarTypePair(varName="b", varType="int")],
        outputs=[VarTypePair(varName="c", varType="int")],
    )
    return CompiledFn(fn_id="add", signature=sig)
