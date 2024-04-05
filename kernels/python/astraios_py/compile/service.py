from typing import Iterator
from uuid import UUID

from .signature import find_signature
from .codegen import as_tierkreis_function_str, random_function_name
from ..worker import Worker

from protos import compile_pb2_grpc
from protos.compile_pb2 import (
    CompileResult,
    CompileRequest,
    CompileResponse,
    CompileStatus,
    CompileError,
    CompiledFunction,
)


class CompilationServicer(compile_pb2_grpc.CompilationServicer):
    def Compile(self, request: CompileRequest, context) -> Iterator[CompileResponse]:
        print("compiling")
        if len(request.cell_contents) != 1:
            # yield CompileError(error="Only one cell is supported")
            print("more than one cell?")
            yield CompileResponse(
                status=CompileStatus(status="Only one cell is supported")
            )
            return
        print("yielding status")
        yield CompileResponse(status=CompileStatus(status="Compiling"))
        print("yielded status")
        cell_id = next(iter(request.cell_contents.keys()))
        print("got cell id")
        cell_content = request.cell_contents[cell_id]
        print("got cell content")
        worker_id = UUID(request.worker_id)
        print("got worker id")
        result = compile_cell(cell_content, worker_id, cell_id)
        print("compiled cell")
        yield CompileResponse(result=CompileResult(func_ids={cell_id: result}))


def compile_cell(code: str, worker_id: UUID, cell_id: str) -> CompiledFunction:
    """
    The actual compilation action.
    """
    sig = find_signature(code)
    fn_name = random_function_name()
    print(f"fn_name = {fn_name}")
    worker = Worker.get_worker(worker_id)
    assert worker
    code = as_tierkreis_function_str(code, sig, fn_name)
    print(f"fcode = {code}")
    worker.add_fn(code)
    print("added function")
    return CompiledFunction(
        func_id=fn_name,
        cell_id=cell_id,
        inputs=sig.inputs,
        outputs=sig.outputs,
        variables={var.name: var for var in sig.variables},
    )
