from .main import app

from fastapi.testclient import TestClient
from urllib.parse import urlencode

client = TestClient(app)


def test_compile():
    response = client.post(
        "/compile/",
        json={
            "contents": "def add(a: int, b: int) -> int:\n    return a + b",
            "scope": [
                {"var": "a", "typ": "int"},
                {"var": "b", "typ": "int"},
            ],
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "fn_id": "add",
        "signature": {
            "inputs": [{"var": "a", "typ": "int"}, {"var": "b", "typ": "int"}],
            "outputs": [{"var": "c", "typ": "int"}],
        },
    }


def test_highlight():
    fn_text = "def add(a: int, b: int) -> int:\n    return a + b"
    encoded_fn_text = urlencode({"cell": fn_text})
    response = client.get(f"/highlight/?{encoded_fn_text}")
    assert response.status_code == 200
    assert response.json() == {
        "text": fn_text,
        "colour": 0,
    }


def test_metadata():
    response = client.get(f"/metadata")
    assert response.status_code == 200
    print(response)
    assert response.json() == {
        "py_version": ["3.8", "3.9", "3.10"],
    }
