from typing import AsyncIterator
from uuid import UUID

from .signature import find_signature
from .codegen import as_tierkreis_function_str, random_function_name
from ..worker import Worker

from ..protos.astraios.compile import CompilationBase
from ..protos.tierkreis.v1alpha1.graph import Type
from ..protos.astraios.compile import (
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
        scope = request.scope
        result = compile_cell(cell_content, worker_id, cell_id, scope)
        yield CompileResponse(result=CompileResult(cells={cell_id: result}))


def compile_cell(
    code: str, worker_id: UUID, cell_id: str, scope: dict[str, Type]
) -> CompiledCell:
    """
    The actual compilation action.
    """
    sig = find_signature(code, scope)
    fn_name = random_function_name()
    worker = Worker.get_worker(worker_id)
    assert worker
    cell_output_name = f"{cell_id}_out"
    code = as_tierkreis_function_str(code, sig, fn_name, cell_output_name)
    worker.add_fn(code)
    return CompiledCell(
        func_id=fn_name,
        cell_id=cell_id,
        inputs=sig.inputs,
        outputs=sig.outputs,
        variables={var.name: var for var in sig.variables},
        cell_output=cell_output_name,
    )
