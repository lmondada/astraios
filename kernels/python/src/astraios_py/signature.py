"""
Function signature inference
"""

import re
from dataclasses import dataclass

from mypy.build import build, BuildSource, BuildResult, Options
from mypy.nodes import Var
from mypy.errorcodes import NAME_DEFINED

from .protos.astraios.compile import Variable as PbVariable
from .typecast import python_to_tk_type, mypy_to_python_type


class ImmutableInputVar(Exception):
    """
    Exception raised when an input variable was mutated.
    """


@dataclass
class VarTypePair:
    """
    A variable and its type.
    """

    name: str
    data_type: type


@dataclass
class Signature:
    """
    The signature of a function.
    """

    inputs: list[VarTypePair]
    outputs: list[VarTypePair]

    def input_names(self) -> list[str]:
        return [v.name for v in self.inputs]

    def output_names(self) -> list[str]:
        return [v.name for v in self.outputs]

    def proto_variables(self) -> dict[str, PbVariable]:
        return {
            v.name: PbVariable(name=v.name, type=python_to_tk_type(v.data_type))
            for v in self.inputs + self.outputs
        }


def find_signature(code: str, scope: dict[str, type]) -> Signature:
    """
    Find the signature of a function.

    This uses mypy to infer the types of the variables.
    """
    signature = Signature(inputs=[], outputs=[])

    # Repeatedly type check code, turning undefined variables into
    # inputs, until all variables are defined
    added_new_inputs = True
    res: BuildResult
    while added_new_inputs:
        type_defs = as_type_defs(signature.inputs)
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
                    err_match = re.search(
                        r'^Name "(\w+)" is not defined$', error.message
                    )
                    assert (
                        err_match is not None
                    ), f"Unexpected error message: {error.message}"
                    var_name = err_match.group(1)
                    if var_name not in signature.inputs:
                        if var_name in scope:
                            print(f"Adding new input: {var_name}")
                            signature.inputs.append(
                                VarTypePair(name=var_name, data_type=scope[var_name])
                            )
                            added_new_inputs = True
                        else:
                            raise ValueError(f"Variable {var_name} not in scope")
                else:
                    pass  # TODO: handle other error codes

    var_defs = res.manager.modules["<astraios>"].names

    def ignore_var(var_name: str) -> bool:
        return var_name.startswith("__") or var_name in signature.input_names()

    for var_name, var in var_defs.items():
        if ignore_var(var_name):
            continue
        if not isinstance(var.node, Var):
            continue
        assert var.node.type is not None, f"Variable {var_name} has no type"
        var_type = mypy_to_python_type(var.node.type)
        signature.outputs.append(VarTypePair(name=var_name, data_type=var_type))

    return signature


def as_type_defs(vars: list[VarTypePair]) -> str:
    """
    Convert a list of variable names into a string of type definitions of the form:

    ```
    a: str
    b: int
    ```
    """
    var_defs = format_name_type_pair(vars)
    return "\n".join(var_defs) + "\n"


def format_name_type_pair(
    vars: list[VarTypePair], *, type_only: bool = False
) -> list[str]:
    """
    Format a list of variables into strings of the format "var:type".

    If `type_only` is passed, format strings without using the variable name
    (useful for function output types).
    """

    if type_only:
        return [v.data_type.__name__ for v in vars]
    else:
        return [f"{v.name}: {v.data_type.__name__}" for v in vars]
