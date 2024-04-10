"""
Python code execution using Tierkreis workers
"""

from dataclasses import make_dataclass
from typing import Union
from uuid import uuid4, UUID

from .protos.astraios.worker import (
    WorkerCreationBase,
    CreateWorkerRequest,
    CreateWorkerResponse,
)
from .codegen import (
    as_function_def,
)
from .signature import VarTypePair

from tierkreis.worker.namespace import Namespace as WorkerNS
from tierkreis.pyruntime import PyRuntime
from tierkreis.builder import Namespace
from tierkreis.core.python import UnpackRow


class WorkerCreationService(WorkerCreationBase):
    async def create_worker(self, request: CreateWorkerRequest) -> CreateWorkerResponse:
        """
        Create a new worker
        """
        worker = Worker.create_worker()
        return CreateWorkerResponse(worker_id=str(worker.worker_id), name="Python")


class Worker:
    """
    A worker that can run Python code
    """

    workers: dict[UUID, "Worker"] = {}
    NAMESPACE: str = "pycells"

    def __init__(self, worker_id: UUID):
        self.worker_id = worker_id
        self.worker = WorkerNS()

    def add_fn(
        self,
        fn_name: str,
        body: str,
        inputs: list[VarTypePair],
        outputs: list[VarTypePair],
    ):
        """
        Add a function to the worker
        """
        # Pack multiple return values into a dataclass
        ReturnType = make_dataclass(
            f"ReturnType_{fn_name}",
            [(o.name, o.data_type) for o in outputs],
            bases=(UnpackRow,),
        )
        # Wrap code in function def
        code = as_function_def(body, inputs, ReturnType, fn_name)
        print(code)

        # pylint: disable=exec-used
        globals = {
            self.NAMESPACE: self.worker[self.NAMESPACE],
            ReturnType.__name__: ReturnType,
        }
        exec(f"@{self.NAMESPACE}.function()\nasync {code}", globals)

    # TODO: support arbitrary arguments
    async def run_testing_only(self, fn_name: str, *args):
        """
        Execute a function.

        This is for testing: it creates a tierkreis runtime and runs the function.
        """
        # pylint: disable=import-outside-toplevel
        from tierkreis.builder import graph, Output, Const

        cl = PyRuntime([self.worker])
        ns = Namespace(await cl.get_signature())[self.NAMESPACE]

        @graph()
        def f_graph() -> Output:
            f = getattr(ns, fn_name)
            outs = f(*[Const(arg) for arg in args])
            return Output(**{k: outs[k] for k in outs.outports})

        print(f_graph.to_proto())

        return await cl.run_graph(f_graph)

    async def contains(self, fn_name: str) -> bool:
        """
        Check if the worker contains a function
        """
        cl = PyRuntime([self.worker])
        ns = Namespace(await cl.get_signature())[self.NAMESPACE]
        return hasattr(ns, fn_name)

    @property
    def namespace(self) -> str:
        """
        The worker's namespace that functions should be register in
        """
        return self.NAMESPACE

    @classmethod
    def create_worker(cls) -> "Worker":
        """
        Create a new worker
        """
        worker_id = uuid4()
        worker = cls(worker_id)
        cls.workers[worker_id] = worker
        return worker

    @classmethod
    def get_worker(cls, worker_id: UUID) -> Union["Worker", None]:
        """
        Get a worker by its ID
        """
        return cls.workers.get(worker_id)
