from .service import compile_cell
from ..worker import Worker


def test_compile_cell():
    worker = Worker.create_worker()
    in_codes = ["a = 3", "a = b + 1"]
    outputs = [["a"], ["a"]]
    inputs = [[], ["b"]]
    for in_code, output, input in zip(in_codes, outputs, inputs):
        fn = compile_cell(in_code, worker_id=worker.worker_id, cell_id="lol")
        print("out", fn.outputs)
        print("in", fn.inputs)
        assert fn.outputs == output
        assert fn.inputs == input
    assert False
