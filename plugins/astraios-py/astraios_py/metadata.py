from pydantic import BaseModel


class Metadata(BaseModel):
    name: str = "Python"
    py_version: list[str] = ["3.8", "3.9", "3.10"]


def metadata() -> Metadata:
    return Metadata()
