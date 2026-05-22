import re
import html

from mistune import HTMLRenderer, Markdown
from mistune.block_parser import BlockParser
from mistune.inline_parser import InlineParser
from mistune.plugins.formatting import strikethrough
from mistune.plugins.url import url
from mistune.util import expand_leading_tab

# All the overrides were discussed here:
# https://forum.snapcraft.io/t/use-of-markdown-in-snap-metadata-summary-description/2128

_INDENT_CODE_TRIM = re.compile(r"^ {1,3}", flags=re.M)


class SnapcraftBlockParser(BlockParser):
    SPECIFICATION = {
        **BlockParser.SPECIFICATION,
        # Indent code is 3 spaces instead of 4
        "indent_code": (
            r"^(?: {3}| *\t)[^\n]+(?:\n+|$)"
            r"((?:(?: {3}| *\t)[^\n]+(?:\n+|$))|\s)*"
        ),
    }

    # We removed many block rules
    DEFAULT_RULES = (
        "blank_line",
        "thematic_break",
        "indent_code",
        "list",
    )

    def parse_indent_code(self, m, state):
        end_pos = state.append_paragraph()
        if end_pos:
            return end_pos
        code = m.group(0)
        code = expand_leading_tab(code)
        code = _INDENT_CODE_TRIM.sub("", code)
        code = code.lstrip("\n")
        state.append_token(
            {"type": "block_code", "raw": code, "style": "indent"}
        )
        return m.end()


class SnapcraftInlineParser(InlineParser):
    SPECIFICATION = {
        **InlineParser.SPECIFICATION,
        # Only match a single backtick so triple-backtick fences stay literal
        "codespan": r"(?<!`)`(?!`)",
    }

    # We removed many inline rules
    DEFAULT_RULES = (
        "escape",
        "auto_link",
        "emphasis",
        "codespan",
        "linebreak",
    )

    def __init__(self):
        super().__init__()
        # Parent __init__ appends "softbreak" drop it so newlines stay as
        # literal characters in the output
        if "softbreak" in self.rules:
            self.rules.remove("softbreak")


renderer = HTMLRenderer()
parser = Markdown(
    renderer=renderer,
    block=SnapcraftBlockParser(),
    inline=SnapcraftInlineParser(),
    plugins=[strikethrough, url],
)


def parse_markdown_description(content):
    unescaped_content = html.unescape(content)
    return parser(unescaped_content)
