import pytest
from typing import cast

from .runtime import RuntimeService
from .worker import Worker
from .protos.astraios.runtime import TempRuntimeStub, TempRunGraphRequest
from .protos.tierkreis.v1alpha1.graph import Graph

from grpclib.testing import ChannelFor
from tierkreis.builder import graph, Output, Const

runtime = RuntimeService()


@pytest.mark.asyncio
async def test_const_graph_run() -> None:
    worker = Worker.create_worker()
    async with ChannelFor([runtime]) as channel:
        stub = TempRuntimeStub(channel)

        @graph()
        def f_graph() -> Output:
            return Output(Const(3))

        tk_graph = cast(Graph, f_graph.to_proto())
        request = TempRunGraphRequest(graph=tk_graph, runtime_id=str(worker.worker_id))
        response = await stub.run_graph(request)

        # A non-empty computation result is returned
        assert response.success.map


def test_graph_proto() -> None:
    import tierkreis.core.protos.tierkreis.v1alpha1.graph as G
    from tierkreis import TierkreisGraph

    fn_node = G.FunctionNode(name=G.FunctionName(name="f", namespaces=["pycells"]))
    g = G.Graph(nodes=[G.Node(function=fn_node)])
    print(list(TierkreisGraph.from_proto(g).nodes()))
    assert False
