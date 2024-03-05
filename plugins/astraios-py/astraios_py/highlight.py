from pydantic import BaseModel


class HighlightedText(BaseModel):
    """
    Text with a int-coded colour.
    """

    text: str
    colour: int


def highlight(text: str) -> HighlightedText:
    """
    Highlight the given text.
    """
    return HighlightedText(text=text, colour=0)
