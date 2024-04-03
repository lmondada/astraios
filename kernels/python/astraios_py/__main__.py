"""
Astraios Language Plugin for Python.
"""

from concurrent import futures

from astraios_py.compile.service import CompilationServicer
from astraios_py.worker import WorkerCreationServicer
from astraios_py.protos.compile_pb2_grpc import add_CompilationServicer_to_server
from astraios_py.protos.worker_pb2_grpc import add_WorkerCreationServicer_to_server
from astraios_py.protos import compile_pb2

import grpc
from grpc_reflection.v1alpha import reflection


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    add_CompilationServicer_to_server(CompilationServicer(), server)
    add_WorkerCreationServicer_to_server(WorkerCreationServicer(), server)
    SERVICE_NAMES = (
        compile_pb2.DESCRIPTOR.services_by_name["Compilation"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)
    server.add_insecure_port("[::]:9090")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
