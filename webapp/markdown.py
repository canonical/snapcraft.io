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

    def _parse_indent_code_fast(self, state):
        # Mistune's fast path strips four-space indentation before our parser.
        return None

    def parse_method(self, m, state):
        # mistune's list parser invokes parse_method for rules outside
        # DEFAULT_RULES (atx_heading, block_quote, ...) render those as
        # paragraph text instead of letting the inherited methods run.
        if m.lastgroup not in self.DEFAULT_RULES:
            end_pos = state.find_line_end()
            state.append_token(
                {"type": "paragraph", "text": state.get_text(end_pos)}
            )
            state.cursor = end_pos
            return end_pos
        return super().parse_method(m, state)


class SnapcraftInlineParser(InlineParser):
    # Override some of InlineParser's functionality to defend against
    # malicious markdown
    #
    # Supported Mistune v3 customization point:
    # - Inline parser methods can be overridden (see InlineParser API).
    #   https://mistune.lepture.com/en/latest/api.html#mistune.InlineParser

    SPECIFICATION = {
        **InlineParser.SPECIFICATION,
        # Only match a single backtick so triple-backtick fences stay literal
        "codespan": r"(?<!`)`(?!`)",
    }

    # We removed many inline rules
    DEFAULT_RULES = (
        "escape",
        "auto_link",
        "auto_email",
        "emphasis",
        "codespan",
        "linebreak",
        "inline_html",
        # Keep rule enabled for mistune precedence compatibility;
        # parse_link_close below turns markdown [text](url) into literal text.
        "link",
        "link_close",
    )

    def __init__(self):
        super().__init__()
        # Parent __init__ appends "softbreak" drop it so newlines stay as
        # literal characters in the output
        if "softbreak" in self.rules:
            self.rules.remove("softbreak")

    def parse_link_close(self, m, state):
        pos = super().parse_link_close(m, state)
        if not state.tokens or state.tokens[-1].get("type") not in {
            "link",
            "image",
        }:
            return pos

        link = state.tokens.pop()
        url = link.get("attrs", {}).get("url")
        if not url:
            state.append_token(link)
            return pos

        label_children = link.get("children", [])
        opening = "![" if link["type"] == "image" else "["
        state.append_token({"type": "text", "raw": opening})
        for child in label_children:
            state.append_token(child)
        state.append_token({"type": "text", "raw": "]("})
        link["type"] = "link"
        link["children"] = [{"type": "text", "raw": url}]
        state.append_token(link)
        state.append_token({"type": "text", "raw": ")"})

        return pos


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
