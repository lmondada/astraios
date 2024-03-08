from collections.abc import Mapping
from typing import Any

from pydantic import BaseModel, Field


class ImmutableInputVar(Exception):
    """
    Exception raised when an input variable was mutated.
    """


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
        self.values = {sym.varName: eval(sym.hintValue) for sym in scope}
        self.types = {sym.varName: eval(sym.varType) for sym in scope}
        self._inputs = set()
        self._outputs = set()

    def __getitem__(self, var):
        if var not in self._outputs:
            # accessing a variable that was not set => input
            self._inputs.add(var)
        return self.values[var]

    def __setitem__(self, var, val):
        if var in self._inputs:
            # cannot change a variable that is an input
            raise ImmutableInputVar("Cannot mutate variable defined elsewhere")
        self._outputs.add(var)
        self.types[var] = type(val)
        self.values[var] = val

    def __iter__(self):
        return iter(self.values)

    def __len__(self):
        return len(self.values)

    def _to_scope_symbol(self, var_names: list[str]):
        def to_scope_symbol(var_name: str):
            hint_value = str(self.values[var_name])
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
    exec(code, None, tracker)  # pylint: disable=exec-used
    return Signature(inputs=tracker.inputs, outputs=tracker.outputs)
