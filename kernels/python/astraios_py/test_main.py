"""
Test main API endpoints
"""

from urllib.parse import urlencode

from fastapi.testclient import TestClient

from .main import app
from .worker import Worker


client = TestClient(app)


def test_compile():
    """
    Test GET /compile for `c = a + b`
    """
    worker = Worker.create_worker()
    response = client.post(
        "/compile/",
        json={
            "code": "c = a + b",
            "options": {},
            "workerUrl": f"http://localhost:8000/worker/{worker.index}",
            "scope": [
                {
                    "varName": "a",
                    "varType": "int",
                    "hintValue": "1",
                },
                {
                    "varName": "b",
                    "varType": "int",
                    "hintValue": "3",
                },
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["signature"] == {
        "inputs": [
            {"varName": "a", "varType": "int", "hintValue": "1"},
            {"varName": "b", "varType": "int", "hintValue": "3"},
        ],
        "outputs": [{"varName": "c", "varType": "int", "hintValue": "4"}],
    }
    assert worker.contains(data["fnId"])


def test_compile_2():
    """
    Test GET /compile for `a = 3` (no input)
    """
    worker = Worker.create_worker()
    response = client.post(
        "/compile/",
        json={
            "code": "a = 3",
            "options": {},
            "workerUrl": f"http://localhost:8000/worker/{worker.index}",
            "scope": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["signature"] == {
        "inputs": [],
        "outputs": [{"varName": "a", "varType": "int", "hintValue": "3"}],
    }
    assert worker.contains(data["fnId"])


def test_highlight():
    """
    Test GET /highlight
    """
    fn_text = "def add(a: int, b: int) -> int:\n    return a + b"
    encoded_fn_text = urlencode({"cell": fn_text})
    response = client.get(f"/highlight/?{encoded_fn_text}")
    assert response.status_code == 200
    split = fn_text.split(" ")
    assert response.json() == list(
        map(
            lambda w: {"text": w + " ", "colour": 1 if w in ["def", "return"] else 0},
            split,
        )
    )


def test_metadata():
    """
    Test GET /metadata
    """
    response = client.get("/metadata")
    assert response.status_code == 200
    assert response.json() == {
        "name": "Python",
        "supportedWorkers": ["http://localhost:8000/worker"],
    }
