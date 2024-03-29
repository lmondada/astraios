"""
Python code execution using Tierkreis workers
"""

from typing import Union
from uuid import uuid4, UUID

from fastapi import APIRouter
from pydantic import BaseModel
from tierkreis.worker.namespace import Namespace as WorkerNS
from tierkreis.pyruntime import PyRuntime
from tierkreis.builder import Namespace

router = APIRouter()


class WorkerInfo(BaseModel):
    """
    Worker information return by /create request
    """

    workerId: UUID
    name: str = "Python"


@router.post("/create")
async def create_worker() -> WorkerInfo:
    """
    Create a new worker
    """
    worker = Worker.create_worker()
    return WorkerInfo(workerId=worker.worker_id)


class Worker:
    """
    A worker that can run Python code
    """

    workers: dict[UUID, "Worker"] = {}
    NAMESPACE: str = "pycells"

    def __init__(self, worker_id: UUID):
        self.worker_id = worker_id
        self.worker = WorkerNS()

    def add_fn(self, code: str):
        """
        Add a function to the worker
        """

        # pylint: disable=unused-variable
        pycells = self.worker[self.NAMESPACE]
        # pylint: disable=exec-used
        exec(f"@{self.NAMESPACE}.function()\nasync {code}")

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
            print(fn_name)
            f = getattr(ns, fn_name)
            print(f)
            return Output(f(Const(args[0]), Const(args[1])))

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
