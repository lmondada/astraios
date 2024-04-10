from .compile import CompilationService
from .worker import Worker
from .protos.astraios.compile import CompilationStub
from .protos.astraios.compile import (
    CompileRequest,
    CompileStatus,
    CompileResponse,
)
from .protos.tierkreis.v1alpha1.graph import Type, Empty

import pytest
from grpclib.testing import ChannelFor

compilation = CompilationService()


@pytest.mark.asyncio
async def test_compile() -> None:
    worker = Worker.create_worker()
    in_codes = ["a = 3", "a = b + 1"]
    outputs = [["a", "lol_out"], ["a", "lol_out"]]
    inputs = [[], ["b"]]
    scopes: list[dict[str, Type]] = [{}, {"b": Type(int=Empty())}]
    async with ChannelFor([compilation]) as channel:
        stub = CompilationStub(channel)
        for in_code, output, input, scope in zip(in_codes, outputs, inputs, scopes):
            request = CompileRequest(
                cell_contents={"lol": in_code},
                worker_id=str(worker.worker_id),
                scope=scope,
            )
            response = stub.compile(request)
            messages = [m async for m in response]
            assert messages[0] == CompileResponse(
                status=CompileStatus(status="Compiling")
            )
            result = messages[1].result.cells["lol"]
            assert result.outputs == output
            assert result.inputs == input
