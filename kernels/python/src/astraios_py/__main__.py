"""
Astraios Language Plugin for Python.
"""

from astraios_py.compile.service import CompilationService
from astraios_py.worker import WorkerCreationService

import asyncio
from grpclib.server import Server
from grpclib.reflection.service import ServerReflection


async def serve():
    services = [CompilationService(), WorkerCreationService()]
    ServerReflection.extend(services)

    server = Server(services)
    print("Server running on port 9090")
    await server.start("0.0.0.0", 9090)
    await server.wait_closed()
    print("Server closed")


if __name__ == "__main__":
    asyncio.run(serve())
