"""
Metadata for the Astraios Python plugin
"""

from pydantic import BaseModel

from .config import APP_BASE_URL


class Metadata(BaseModel):
    """
    Plugin metadata
    """

    name: str = "Python"
    supportedWorkers: list[str] = [f"{APP_BASE_URL}/worker"]


def metadata() -> Metadata:
    """
    Return the metadata for the plugin
    """
    return Metadata()
