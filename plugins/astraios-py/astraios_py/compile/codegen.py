"""
Generate Python code for eval
"""

import textwrap
from uuid import uuid4

from .signature import Signature, ScopeSymbol


def as_tierkreis_function_str(code: str, sig: Signature, fn_name: str) -> str:
    """
    Convert a code string and a signature into a function string.

    Prefix function definition with @{namespace}.function()
    """

    def to_str(symb: ScopeSymbol):
        return f"{symb.varName}: {symb.varType}"

    inputs = ",".join(map(to_str, sig.inputs))
    outputs = ",".join(map(lambda symb: symb.varType, sig.outputs))
    code = textwrap.indent(code, "    ")
    return textwrap.dedent(
        f"""\
        def {fn_name}({inputs}) -> ({outputs}):
        {code}
        """
    )


def random_function_name() -> str:
    """
    Generate a unique Python function name.

    Currently using uuid4.

    :return: A valid Python function name string.
    """
    # Convert UUID to a string without hyphens
    uuid_str = str(uuid4()).replace("-", "_")
    # Ensure the name starts with a letter ('f' in this case)
    if not uuid_str[0].isalpha():
        uuid_str = "f" + uuid_str
    return uuid_str
