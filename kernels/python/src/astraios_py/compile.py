from typing import AsyncIterator
from uuid import UUID

from .signature import find_signature
from .codegen import (
    random_function_name,
    prepend_cell_output,
)
from .typecast import tk_type_to_python
from .worker import Worker

from .protos.astraios.compile import CompilationBase
from .protos.astraios.compile import (
    CompileResult,
    CompileRequest,
    CompileResponse,
    CompileStatus,
    CompiledCell,
)


class CompilationService(CompilationBase):
    async def compile(self, request: CompileRequest) -> AsyncIterator[CompileResponse]:
        if len(request.cell_contents) != 1:
            # yield CompileError(error="Only one cell is supported")
            yield CompileResponse(
                status=CompileStatus(status="Only one cell is supported")
            )
            return
        yield CompileResponse(status=CompileStatus(status="Compiling"))
        cell_id = next(iter(request.cell_contents.keys()))
        cell_content = request.cell_contents[cell_id]
        worker_id = UUID(request.worker_id)
        scope = {n: tk_type_to_python(t) for n, t in request.scope.items()}
        result = compile_cell(cell_content, worker_id, cell_id, scope)
        yield CompileResponse(result=CompileResult(cells={cell_id: result}))


def compile_cell(
    code: str, worker_id: UUID, cell_id: str, scope: dict[str, type]
) -> CompiledCell:
    """
    The actual compilation action.
    """
    # Handle the expression on last line
    cell_output_name = f"{cell_id}_out"
    code = prepend_cell_output(code, cell_output_name)

    # Find the inputs and outputs of the cell
    sig = find_signature(code, scope)

    # Create function name
    fn_name = random_function_name()

    # Load code into worker
    worker = Worker.get_worker(worker_id)
    assert worker
    worker.add_fn(fn_name, code, inputs=sig.inputs, outputs=sig.outputs)

    return CompiledCell(
        func_id=fn_name,
        cell_id=cell_id,
        inputs=sig.input_names(),
        outputs=sig.output_names(),
        variables=sig.proto_variables(),
        cell_output=cell_output_name,
    )
