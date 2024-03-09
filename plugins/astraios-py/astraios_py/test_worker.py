"""
Testing worker creating / code execution
"""

import textwrap

import pytest

from .worker import Worker


@pytest.mark.asyncio
async def test_worker():
    """
    Create a worker and run code on it
    """
    worker = Worker.create_worker()
    code = textwrap.dedent(
        f"""\
    @{worker.namespace}.function()
    def add(a: int, b: int) -> int:
        return a + b
    """
    )
    worker.add_fn(code)
    assert await worker.run_testing_only("add", 1, 2) == 3
