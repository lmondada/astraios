"""
Generate Python code for eval
"""

import textwrap
from uuid import uuid4

from .signature import Signature, format_name_type_pair

FN_TEMPLATE = """\
def {fn_name}({inputs}) -> tuple[{outputs}]:
{code}
"""


def as_tierkreis_function_str(
    code: str, sig: Signature, fn_name: str, cell_output_name: str
) -> str:
    """
    Convert a code string and a signature into a function string.

    Prefix function definition with @{namespace}.function()
    """

    inputs = ",".join(format_name_type_pair(sig.inputs, sig.variables))
    outputs = ",".join(
        format_name_type_pair(sig.outputs, sig.variables, type_only=True)
    )
    code = prepend_cell_output(code, cell_output_name)
    code += f"\nreturn ({cell_output_name}, {','.join(sig.outputs)})"
    code = textwrap.indent(code, "    ")
    return FN_TEMPLATE.format(
        fn_name=fn_name, inputs=inputs, outputs=outputs, code=code
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


def prepend_cell_output(code: str, cell_output_name: str) -> str:
    """Add cell_output = xyz to the last expression of the code"""
    code_lines = code.strip().split("\n")
    code_lines[-1] = f"{cell_output_name} = " + code_lines[-1]
    code = "\n".join(code_lines)
    return code
