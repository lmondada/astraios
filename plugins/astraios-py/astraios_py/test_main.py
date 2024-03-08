from .main import app

from fastapi.testclient import TestClient
from urllib.parse import urlencode

client = TestClient(app)


def test_compile():
    response = client.post(
        "/compile/",
        json={
            "code": "c = a + b",
            "options": {},
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
    assert response.json() == {
        "fn_id": "add",
        "signature": {
            "inputs": [
                {"varName": "a", "varType": "int", "hintValue": "1"},
                {"varName": "b", "varType": "int", "hintValue": "3"},
            ],
            "outputs": [{"varName": "c", "varType": "int", "hintValue": "4"}],
        },
    }


def test_compile_2():
    response = client.post(
        "/compile/",
        json={
            "code": "a = 3",
            "options": {},
            "scope": [],
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "fn_id": "add",
        "signature": {
            "inputs": [],
            "outputs": [{"varName": "a", "varType": "int", "hintValue": "3"}],
        },
    }


def test_highlight():
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
    response = client.get(f"/metadata")
    assert response.status_code == 200
    assert response.json() == {
        "name": "Python",
        "py_version": ["3.8", "3.9", "3.10"],
    }
