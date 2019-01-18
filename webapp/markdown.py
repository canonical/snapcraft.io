from mistune import (
    BlockGrammar,
    BlockLexer,
    Renderer,
    Markdown,
    _pure_pattern,
    InlineLexer,
)
import re


class DescriptionGrammar(BlockGrammar):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # This is an extention of the list block rule written in BlockGrammar
        # of mistune library:
        # https://github.com/lepture/mistune/blob/master/mistune.py#L120-L141
        # We want to support the • as a tag for lists in markdown.
        # To do this this [*+-•] is the list of supported tags
        self.list_block = re.compile(
            r"^( *)(?=[*+-•]|\d+\.)(([*+-•])?(?:\d+\.)?) [\s\S]+?"
            r"(?:"
            r"\n+(?=\1?(?:[-*_•] *){3,}(?:\n+|$))"  # hrule
            r"|\n+(?=%s)"  # def links
            r"|\n+(?=%s)"  # def footnotes\
            r"|\n+(?=\1(?(3)\d+\.|[*+-•]) )"  # heterogeneous bullet
            r"|\n{2,}"
            r"(?! )"
            r"(?!\1(?:[*+-•]|\d+\.) )\n*"
            r"|"
            r"\s*$)"
            % (
                _pure_pattern(super().def_links),
                _pure_pattern(super().def_footnotes),
            )
        )
        self.list_bullet = re.compile(r"^ *(?:[*+-•]|\d+\.) +")
        self.list_item = re.compile(
            r"^(( *)(?:[*+-•]|\d+\.) [^\n]*"
            r"(?:\n(?!\2(?:[*+-•]|\d+\.) )[^\n]*)*)",
            flags=re.M,
        )


class DescriptionBlock(BlockLexer):
    grammar_class = DescriptionGrammar

    default_rules = [
        "fences",
        "block_code",
        "list_block",
        "paragraph",
        "text",
        "newline",
    ]

    list_rules = ("block_code", "list_block", "text", "newline")


class DescriptionInline(InlineLexer):
    def _process_link(self, m, link, title=None):
        line = m.group(0)
        if line[0] != "!":
            return super()._process_link(m, link, title)


renderer = Renderer()
parser = Markdown(
    renderer=renderer,
    block=DescriptionBlock(),
    inline=DescriptionInline(renderer=renderer),
)


def parse_markdown_description(content):
    return parser(content)
