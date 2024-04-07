from typing import Iterator
from uuid import UUID

from .signature import find_signature
from .codegen import as_tierkreis_function_str, random_function_name
from ..worker import Worker

from protos import compile_pb2_grpc
from protos.tierkreis.graph_pb2 import Type
from protos.compile_pb2 import (
    CompileResult,
    CompileRequest,
    CompileResponse,
    CompileStatus,
    CompiledFunction,
)


class CompilationServicer(compile_pb2_grpc.CompilationServicer):
    def Compile(self, request: CompileRequest, context) -> Iterator[CompileResponse]:
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
        yield CompileResponse(result=CompileResult(func_ids={cell_id: result}))


def compile_cell(
    code: str, worker_id: UUID, cell_id: str, scope: dict[str, Type]
) -> CompiledFunction:
    """
    The actual compilation action.
    """
    sig = find_signature(code, scope)
    fn_name = random_function_name()
    worker = Worker.get_worker(worker_id)
    assert worker
    code = as_tierkreis_function_str(code, sig, fn_name)
    worker.add_fn(code)
    return CompiledFunction(
        func_id=fn_name,
        cell_id=cell_id,
        inputs=sig.inputs,
        outputs=sig.outputs,
        variables={var.name: var for var in sig.variables},
    )
