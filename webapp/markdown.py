import re

from mistune import HTMLRenderer, Markdown
from mistune.block_parser import BlockParser
from mistune.inline_parser import InlineParser
from mistune.plugins.extra import plugin_strikethrough, plugin_url

# All the overrides were discussed here:
# https://forum.snapcraft.io/t/use-of-markdown-in-snap-metadata-summary-description/2128

_INDENT_CODE_TRIM = re.compile(r"^ {1,3}", flags=re.M)


class SnapcraftBlockParser(BlockParser):
    # Indent code is 3 spaces instead of 4
    INDENT_CODE = re.compile(r"(?:\n*)(?:(?: {3}| *\t)[^\n]+\n*)+")

    # We removed many block rules
    RULE_NAMES = (
        "newline",
        "thematic_break",
        "indent_code",
        "list_start",
    )


class SnapcraftInlineParser(InlineParser):
    CODESPAN = r"^(`)([ \S]*?[^`])\1(?!`)"

    # We removed many inline rules
    RULE_NAMES = (
        "escape",
        "auto_link",
        "ref_link",  # Kept so we don't have to override more code but not used
        "ref_link2",  # Same as above
        "asterisk_emphasis",
        "underscore_emphasis",
        "codespan",
        "linebreak",
    )


renderer = HTMLRenderer()
parser = Markdown(
    renderer=renderer,
    block=SnapcraftBlockParser(),
    inline=SnapcraftInlineParser(renderer),
    plugins=[plugin_strikethrough, plugin_url],
)


def parse_markdown_description(content):
    return parser(content)
