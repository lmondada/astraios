"""
Generate Python code for eval
"""

from dataclasses import fields, is_dataclass
import textwrap
from uuid import uuid4

from .signature import VarTypePair

FN_TEMPLATE = """\
def {fn_name}({inputs}) -> {output_type}:
{code}
"""


def as_function_def(
    body: str,
    inputs: list[VarTypePair],
    OutputType: type,
    fn_name: str,
) -> str:
    """
    Convert a code string and a signature into a function string.

    This includes:
    - Start with function def
    - List inputs as function arguments
    - Wrap outputs into a dataclass OutputType

    OutputType must be a dataclass.
    """
    assert is_dataclass(OutputType)

    # Return statement, looks like "return ReturnType(var_a=var_a, var_b=varb)"
    fields_eq_fields = [f"{f.name}={f.name}" for f in fields(OutputType)]
    body += f"\nreturn {OutputType.__name__}({','.join(fields_eq_fields)})"

    body = textwrap.indent(body, "    ")
    inputs_str = ", ".join(f"{v.name}: {v.data_type.__name__}" for v in inputs)
    return FN_TEMPLATE.format(
        fn_name=fn_name, inputs=inputs_str, output_type=OutputType.__name__, code=body
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


PRINT_LAST_EXPR_TEMPLATE = """\
__final_expr = {expr}
{cell_output_name}: str = ""
try:
    {cell_output_name} = repr(__final_expr)
except Exception: pass
"""


def prepend_cell_output(code: str, cell_output_name: str) -> str:
    """Add {cell_output} = str(xyz) to the last expression of the code"""
    code_lines = code.strip().split("\n")
    code_lines[-1] = PRINT_LAST_EXPR_TEMPLATE.format(
        cell_output_name=cell_output_name, expr=code_lines[-1]
    )
    code = "\n".join(code_lines)
    return code
