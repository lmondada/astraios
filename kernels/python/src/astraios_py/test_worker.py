from .worker import WorkerCreationService
from .protos.astraios.worker import CreateWorkerRequest, WorkerCreationStub

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
