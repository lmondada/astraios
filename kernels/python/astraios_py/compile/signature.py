"""
Function signature inference
"""

import re

from pydantic import BaseModel
from mypy.build import build, BuildSource, BuildResult, Options
from mypy.nodes import Var
from mypy.errorcodes import NAME_DEFINED


class ImmutableInputVar(Exception):
    """
    Exception raised when an input variable was mutated.
    """


VariableName = str
VariableType = str


class Variable(BaseModel):
    """
    A pair of a variable name and its type.
    """

    name: VariableName
    varType: VariableType


class Signature(BaseModel):
    """
    The signature of a function.
    """

    inputs: list[VariableName]
    outputs: list[VariableName]
    variables: list[Variable]


# class ScopeTracker(Mapping):
#     """
#     A dict-like object that stores which variables are accessed and modified.
#     """

#     def __init__(self, scope: list[ScopeSymbol]):
#         try:
#             # pylint: disable=eval-used
#             self.types = {sym.varName: eval(sym.varType) for sym in scope}
#         except (NameError, SyntaxError) as exc:
#             raise HTTPException(
#                 status_code=400, detail="Scope types not understood"
#             ) from exc
#         try:
#             # pylint: disable=eval-used
#             self._values = {
#                 sym.varName: eval(sym.hintValue)
#                 for sym in scope
#                 if sym.hintValue is not None
#             }
#         except (NameError, SyntaxError) as exc:
#             raise HTTPException(
#                 status_code=400, detail="Value hints are required for inference"
#             ) from exc
#         self._inputs: set[str] = set()
#         self._outputs: set[str] = set()

#     def __getitem__(self, var):
#         if var not in self._outputs:
#             # accessing a variable that was not set => input
#             self._inputs.add(var)
#         try:
#             return self._values[var]
#         except KeyError as exc:
#             raise HTTPException(
#                 status_code=400, detail=f"Variable {var} not in scope"
#             ) from exc

#     def __setitem__(self, var, val):
#         if var in self._inputs:
#             # cannot change a variable that is an input
#             raise HTTPException(
#                 status_code=400,
#                 detail="Cannot mutate input variable",
#             )
#         self._outputs.add(var)
#         self.types[var] = type(val)
#         self._values[var] = val

#     def __iter__(self):
#         return iter(self._values)

#     def __len__(self):
#         return len(self._values)

#     def _to_scope_symbol(self, var_names: Iterable[str]):
#         def to_scope_symbol(var_name: str):
#             hint_value = str(self._values[var_name])
#             var_type = self.types[var_name].__name__
#             return ScopeSymbol(varName=var_name, varType=var_type, hintValue=hint_value)

#         symbs = list(map(to_scope_symbol, var_names))
#         symbs.sort(key=lambda sym: sym.varName)
#         return symbs

#     @property
#     def outputs(self) -> list[ScopeSymbol]:
#         """
#         Get the output variables as ScopeSymbols.
#         """
#         return self._to_scope_symbol(self._outputs)

#     @property
#     def inputs(self) -> list[ScopeSymbol]:
#         """
#         Get the input variables as ScopeSymbols.
#         """
#         return self._to_scope_symbol(self._inputs)


def find_signature(code: str, scope: list[Variable]) -> Signature:
    """
    Find the signature of a function.

    This uses mypy to infer the types of the variables.
    """
    inputs: list[str] = []
    outputs: list[str] = []
    variables: list[Variable] = []

    # Repeatedly type check code, turning undefined variables into
    # inputs, until all variables are defined
    added_new_inputs = True
    res: BuildResult
    while added_new_inputs:
        type_defs = as_type_defs(inputs, variables)
        res = build(
            sources=[
                BuildSource(path=None, text=type_defs + code, module="<astraios>")
            ],
            options=Options(),
        )
        added_new_inputs = False
        for errors in res.manager.errors.error_info_map.values():
            for error in errors:
                if error.code == NAME_DEFINED:
                    match = re.search(r'^Name "(\w+)" is not defined$', error.message)
                    assert (
                        match is not None
                    ), f"Unexpected error message: {error.message}"
                    var_name = match.group(1)
                    if var_name not in inputs:
                        print(f"Adding new input: {var_name}")
                        inputs.append(var_name)
                        variables.append(Variable(name=var_name, varType="int"))
                        added_new_inputs = True
                else:
                    pass  # TODO: handle other error codes

    var_defs = res.manager.modules["<astraios>"].names

    def ignore_var(var_name: str) -> bool:
        return var_name.startswith("__") or var_name in inputs

    for var_name, var in var_defs.items():
        if ignore_var(var_name):
            continue
        if not isinstance(var.node, Var):
            continue
        var_type = get_var_type(var.node)
        outputs.append(var_name)
        variables.append(Variable(name=var_name, varType=var_type))

    return Signature(inputs=inputs, outputs=outputs, variables=variables)


def as_type_defs(var_names: list[str], variables: list[Variable]) -> str:
    """
    Convert a list of variable names into a string of type definitions of the form:

    ```
    a: str
    b: int
    ```
    """
    var_defs = format_name_type_pair(var_names, variables)
    return "\n".join(var_defs) + "\n"


def format_name_type_pair(
    var_names: list[str], variables: list[Variable], *, type_only: bool = False
) -> list[str]:
    """
    Format a list of variables into strings of the format "var:type".

    If `type_only` is passed, format strings without using the variable name
    (useful for function output types).
    """

    def to_str(symb: Variable):
        return symb.varType if type_only else f"{symb.name}: {symb.varType}"

    vars_name_type_pairs = {v.name: to_str(v) for v in variables}
    return list(map(lambda v: vars_name_type_pairs[v], var_names))


def get_var_type(var: Var) -> str:
    """
    Get the type of a variable.
    """
    type_repr = repr(var.type)
    if type_repr.startswith("builtins."):
        return type_repr[9:]
    return type_repr
