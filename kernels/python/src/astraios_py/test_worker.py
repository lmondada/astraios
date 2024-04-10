from .protos.astraios.worker import CreateWorkerRequest, WorkerCreationStub
from .signature import VarTypePair
from .worker import WorkerCreationService, Worker

import pytest
from grpclib.testing import ChannelFor

worker_creation = WorkerCreationService()


@pytest.mark.asyncio
async def test_create_worker() -> None:
    async with ChannelFor([worker_creation]) as channel:
        stub = WorkerCreationStub(channel)
        request = CreateWorkerRequest()
        response = await stub.create_worker(request)
        assert response.worker_id is not None
        assert response.name == "Python"


@pytest.mark.asyncio
async def test_run_fn() -> None:
    worker = Worker.create_worker()
    worker.add_fn(
        fn_name="f",
        body="sum, mul = a + b, a * b",
        inputs=[
            VarTypePair(name="a", data_type=int),
            VarTypePair(name="b", data_type=int),
        ],
        outputs=[
            VarTypePair(name="sum", data_type=int),
            VarTypePair(name="mul", data_type=int),
        ],
    )
    result = await worker.run_testing_only("f", 1, 2)
    assert result["sum"].value == 3
    assert result["mul"].value == 2
