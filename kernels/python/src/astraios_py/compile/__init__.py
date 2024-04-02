# """ Submit and process compilation jobs for Python """

# from dataclasses import dataclass
# from queue import Queue
# from typing import Iterator
# from uuid import uuid4, UUID

# from .signature import find_signature
# from .codegen import as_tierkreis_function_str, random_function_name
# from .types import JobID, CompiledFn, JobSubmission, Event, ResultEvent, MessageEvent
# from ..worker import Worker


# @dataclass
# class Job:
#     """
#     A compilation job.

#     As the compilation happens in a background task, status updates are pushed
#     to the queue and streamed to the client (assuming the client called /status
#     after /submit).
#     """

#     cell: JobSubmission
#     status_updates: Queue[Event] = Queue()
#     is_done: bool = False


# class JobManager:
#     """
#     Manages compilation jobs.

#     We use a single instance of this class as a place to store jobs and run them.
#     """

#     def __init__(self) -> None:
#         self.jobs: dict[UUID, Job] = {}

#     def add_job(self, cell: JobSubmission) -> UUID:
#         """
#         Add a compilation job to the manager.

#         This will simply create a job ID, store the job data and return it.

#         Call `compile` to actually get the job started.
#         """
#         job_id = uuid4()
#         self.jobs[job_id] = Job(cell=cell)
#         return job_id

#     def add_status_update(self, job_id: UUID, event: Event) -> None:
#         """
#         Append a status update to the job's status updates queue.

#         Meant to be passed as a callback to the background task.
#         """
#         assert job_id in self.jobs
#         # raise HTTPException(status_code=404, detail="Job not found")
#         self.jobs[job_id].status_updates.put(event)

#     def compile(self, job_id: UUID):
#         """
#         Run the compilation task.
#         """
#         job = self.jobs[job_id]
#         self.add_status_update(job_id, MessageEvent(data="Compiling..."))
#         result = compile_cell(job.cell)
#         job.is_done = True
#         self.add_status_update(job_id, ResultEvent(data=result))

#     def status_events(self, job_id: UUID) -> Iterator[dict[str, str | CompiledFn]]:
#         """
#         A stream of status updates as a generator.
#         """
#         job = self.jobs.get(job_id)
#         assert job
#         # raise HTTPException(status_code=404, detail="Job not found")
#         while not job.is_done or not job.status_updates.empty():
#             new_status = job.status_updates.get(block=True)
#             if isinstance(new_status, ResultEvent):
#                 yield {
#                     "event": new_status.event,
#                     "data": new_status.data.model_dump_json(),
#                 }
#             else:
#                 yield {"event": new_status.event, "data": new_status.data}


# job_manager = JobManager()


# @router.post("/submit")
# def submit_compile_job(bg: BackgroundTasks, cell: JobSubmission) -> JobID:
#     """
#     Compile a cell of code and submit to a worker.
#     """
#     assert len(cell.cellIds) == 1
#     job_id = job_manager.add_job(cell)
#     bg.add_task(job_manager.compile, job_id)
#     return JobID(jobId=job_id)


# @router.get("/status")
# def status(jobId: UUID):
#     """
#     Get the status of a compilation job
#     """
#     return EventSourceResponse(job_manager.status_events(jobId))


# def compile_cell(cell: JobSubmission) -> CompiledFn:
#     """
#     The actual compilation action.

#     TODO: Currently not actually infering signature...
#     """
#     assert len(cell.cellIds) == 1
#     cell_id = cell.cellIds[0]
#     code = cell.codes[0]
#     sig = find_signature(code, [])
#     fn_name = random_function_name()
#     print(f"fn_name = {fn_name}")
#     worker = Worker.get_worker(cell.workerId)
#     if not worker:
#         raise HTTPException(status_code=500, detail="Worker not found")
#     code = as_tierkreis_function_str(code, sig, fn_name)
#     print(f"fcode = {code}")
#     worker.add_fn(code)
#     print("added function")
#     return CompiledFn(
#         funcId=fn_name,
#         cellId=cell_id,
#         inputs=sig.inputs,
#         outputs=sig.outputs,
#         variables=sig.variables,
#     )
