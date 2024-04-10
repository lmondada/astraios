"""
From Tierkreis to Python type casting.

The Python -> Tierkreis -> Proto part is just calling the Tierkreis typecasting.
We have a nasty issue atm whereby tierkreis protobuf types are generated twice
and are thus duplicates. Thankfully we can ignore this with some casting and
duck typing magic.

The other direction Proto -> Tierkreis -> Python part is actually missing in
tierkreis currently. We temporarily only support a very small subset of types.
"""

from typing import cast

import mypy.types as mypy
from tierkreis.core.types import (
    TierkreisType,
    IntType,
    FloatType,
    BoolType,
    StringType,
    VecType,
)

# This is nasty, sorry. Eventually we will have TkAstrType === TkType
from tierkreis.core.protos.tierkreis.v1alpha1.graph import Type as TkType
from .protos.tierkreis.v1alpha1.graph import Type as TkAstrType


def tk_type_to_python(tk_type: TkAstrType) -> type:
    t = TierkreisType.from_proto(cast(TkType, tk_type))
    match t:
        case IntType():
            return int
        case FloatType():
            return float
        case BoolType():
            return bool
        case StringType():
            return str
        case VecType():
            # TODO: we pretend everything is int lol
            return list[int]
        case _:
            raise ValueError(f"Unknown type: {t}")


def python_to_tk_type(python_type: type) -> TkAstrType:
    return cast(TkAstrType, TierkreisType.from_python(python_type).to_proto())


def mypy_to_python_type(mypy_type: mypy.Type) -> type:
    """
    Convert types obtained from mypy's type inference into legit python types.

    This is another minefield
    """
    match str(mypy_type):
        case "builtins.int":
            return int
        case "builtins.float":
            return float
        case "builtins.bool":
            return bool
        case "builtins.str":
            return str
        case "builtins.list[builtins.int]":
            return list[int]
        case _:
            raise ValueError(f"Unknown type: {mypy_type}")
