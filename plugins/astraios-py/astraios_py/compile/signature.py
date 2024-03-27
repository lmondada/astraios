"""
Function signature inference
"""

from collections.abc import Mapping
from typing import Iterable

from pydantic import BaseModel, Field
from fastapi import HTTPException


class ImmutableInputVar(Exception):
    """
    Exception raised when an input variable was mutated.
    """


VariableName = str
VariableType = str


class Variable(BaseModel):
    name: VariableName
    varType: VariableType


class ScopeSymbol(BaseModel):
    """
    A symbol in scope.

    For now, types and variables are strings to be evaled in python.
    TODO: make these tierkreis values and types
    """

    varName: str
    varType: str
    hintValue: str | None = Field(
        default=None
    )  # provide a value for the symbol to help with type inference


class Signature(BaseModel):
    """
    The signature of a function.
    """

    # inputs as var:type pairs
    inputs: list[ScopeSymbol]
    # outputs as var:type pairs
    outputs: list[ScopeSymbol]


class ScopeTracker(Mapping):
    """
    A dict-like object that stores which variables are accessed and modified.
    """

    def __init__(self, scope: list[ScopeSymbol]):
        try:
            # pylint: disable=eval-used
            self.types = {sym.varName: eval(sym.varType) for sym in scope}
        except (NameError, SyntaxError) as exc:
            raise HTTPException(
                status_code=400, detail="Scope types not understood"
            ) from exc
        try:
            # pylint: disable=eval-used
            self._values = {
                sym.varName: eval(sym.hintValue)
                for sym in scope
                if sym.hintValue is not None
            }
        except (NameError, SyntaxError) as exc:
            raise HTTPException(
                status_code=400, detail="Value hints are required for inference"
            ) from exc
        self._inputs: set[str] = set()
        self._outputs: set[str] = set()

    def __getitem__(self, var):
        if var not in self._outputs:
            # accessing a variable that was not set => input
            self._inputs.add(var)
        try:
            return self._values[var]
        except KeyError as exc:
            raise HTTPException(
                status_code=400, detail=f"Variable {var} not in scope"
            ) from exc

    def __setitem__(self, var, val):
        if var in self._inputs:
            # cannot change a variable that is an input
            raise HTTPException(
                status_code=400,
                detail="Cannot mutate input variable",
            )
        self._outputs.add(var)
        self.types[var] = type(val)
        self._values[var] = val

    def __iter__(self):
        return iter(self._values)

    def __len__(self):
        return len(self._values)

    def _to_scope_symbol(self, var_names: Iterable[str]):
        def to_scope_symbol(var_name: str):
            hint_value = str(self._values[var_name])
            var_type = self.types[var_name].__name__
            return ScopeSymbol(varName=var_name, varType=var_type, hintValue=hint_value)

        symbs = list(map(to_scope_symbol, var_names))
        symbs.sort(key=lambda sym: sym.varName)
        return symbs

    @property
    def outputs(self) -> list[ScopeSymbol]:
        """
        Get the output variables as ScopeSymbols.
        """
        return self._to_scope_symbol(self._outputs)

    @property
    def inputs(self) -> list[ScopeSymbol]:
        """
        Get the input variables as ScopeSymbols.
        """
        return self._to_scope_symbol(self._inputs)


def find_signature(code: str, scope: list[ScopeSymbol]) -> Signature:
    """
    Find the signature of a function.

    By executing its code in a fake environment where all variables are tracked.

    Note that this requires value hints for variables in scope. It may be
    that variables only accessed/modified in conditional branches are not
    seen, in which case this function will not be able to track them.
    """
    tracker = ScopeTracker(scope)
    try:
        exec(code, None, tracker)  # pylint: disable=exec-used
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Python error: {exc}") from exc
    return Signature(inputs=tracker.inputs, outputs=tracker.outputs)
