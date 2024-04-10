from typing import cast
from uuid import UUID

from .protos.astraios.runtime import (
    TempRuntimeBase,
    TempRunGraphRequest,
    TempRunGraphResponse,
    CreateRuntimeRequest,
    CreateRuntimeResponse,
)
from .protos.tierkreis.v1alpha1.graph import StructValue, Value
from .worker import Worker

from tierkreis import TierkreisGraph, render_graph
from tierkreis.pyruntime import PyRuntime
from tierkreis.builder import Namespace
from tierkreis.core.protos.tierkreis.v1alpha1.graph import Graph


class RuntimeService(TempRuntimeBase):
    async def create_runtime(
        self, create_runtime_request: CreateRuntimeRequest
    ) -> CreateRuntimeResponse:
        # hack: use the worker_id as the runtime_id
        worker_id = create_runtime_request.worker_id
        return CreateRuntimeResponse(runtime_id=worker_id, name="Local PyRuntime")

    async def run_graph(self, request: TempRunGraphRequest) -> TempRunGraphResponse:
        worker_id = UUID(request.runtime_id)
        worker = Worker.get_worker(worker_id)
        if worker is None:
            return TempRunGraphResponse(error="Worker not found")
        # hack: both og tierkreis proto defs and astraios redefs live in here, gross
        with open("./log", "a") as f:
            f.write(str(request.graph))
        cl = PyRuntime([worker.worker])
        with open("./log", "a") as f:
            ns = Namespace(await cl.get_signature())
            f.write(str(list(ns.keys())) + "\n")
            f.write("accessing key pycells\n")
            f.write(str(ns["pycells"]) + "\n")
        tk_graph = TierkreisGraph.from_proto(cast(Graph, request.graph))
        render_graph(tk_graph, f"./live-outputs/{worker_id}.dot", "png")
        with open("./log", "a") as f:
            f.write("Done reading in graph\n")
            f.write(str(tk_graph.to_proto()) + "\n")

        cl = PyRuntime([worker.worker])
        response = await cl.run_graph(tk_graph)
        # except Exception as e:
        #     return TempRunGraphResponse(error=str(e))
        proto_response = {k: cast(Value, v.to_proto()) for k, v in response.items()}
        return TempRunGraphResponse(success=StructValue(map=proto_response))
