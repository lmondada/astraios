"""
Typedefs for compilation jobs.
"""

from uuid import UUID

from pydantic import BaseModel

from .signature import VariableName, Variable


class JobID(BaseModel):
    """
    The ID of a compilation submission.
    """

    jobId: UUID


class CompiledFn(BaseModel):
    """
    The result of cell compilation.
    """

    funcId: str
    cellId: str
    inputs: list[VariableName]
    outputs: list[VariableName]
    variables: list[Variable]


class JobSubmission(BaseModel):
    """
    Data for a new compilation job submission.

    Composed of the cell contents, their IDs and the worker to load the
    code into.
    """

    cellIds: list[str]
    codes: list[str]
    workerId: UUID


class ResultEvent(BaseModel):
    """
    Final result of a compilation job.

    Streamed as SSE events
    """

    event: str = "result"
    data: CompiledFn


class MessageEvent(BaseModel):
    """
    Intermediate status updates during compilation.

    Streamed as SSE events
    """

    event: str = "message"
    data: str


Event = ResultEvent | MessageEvent
