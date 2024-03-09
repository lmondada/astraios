"""
Very naive Python syntax highlighting
"""

from pydantic import BaseModel


class HighlightedToken(BaseModel):
    """
    Text with a int-coded colour.
    """

    text: str
    colour: int


def highlight(text: str) -> list[HighlightedToken]:
    """
    Split text into highlighted tokens.
    """
    def highlight_word(word):
        keywords = {'for', 'if', 'while', 'else', 'return', 'def', 'in', 'break', 'class'}
        return HighlightedToken(text=word + ' ', colour=1 if word in keywords else 0)

    return list(map(highlight_word, text.split(' ')))
