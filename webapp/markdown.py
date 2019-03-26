from mistune import (
    BlockGrammar,
    BlockLexer,
    InlineGrammar,
    Renderer,
    Markdown,
    _pure_pattern,
    InlineLexer,
)
import re


class DescriptionBlockGrammar(BlockGrammar):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # This is an extention of the list block rule written in BlockGrammar
        # of mistune library:
        # https://github.com/lepture/mistune/blob/master/mistune.py#L120-L141
        # We want to support the • as a tag for lists in markdown.
        # To do this this [*+-•] is the list of supported tags
        self.list_block = re.compile(
            r"^( *)(?=[•*+-]|\d+\.)(([•*+-])?(?:\d+\.)?) [\s\S]+?"
            r"(?:"
            r"\n+(?=\1?(?:[-*_] *){3,}(?:\n+|$))"  # hrule
            r"|\n+(?=%s)"  # def links
            r"|\n+(?=%s)"  # def footnotes\
            r"|\n+(?=\1(?(3)\d+\.|[•*+-]) )"  # heterogeneous bullet
            r"|\n{2,}"
            r"(?! )"
            r"(?!\1(?:[•*+-]|\d+\.) )\n*"
            r"|"
            r"\s*$)"
            % (
                _pure_pattern(super().def_links),
                _pure_pattern(super().def_footnotes),
            )
        )
        self.list_item = re.compile(
            r"^(( *)(?:[•*+-]|\d+\.) [^\n]*"
            r"(?:\n(?!\2(?:[•*+-]|\d+\.) )[^\n]*)*)",
            flags=re.M,
        )
        self.list_bullet = re.compile(r"^ *(?:[•*+-]|\d+\.) +")
        self.block_code = re.compile(r"^( {3}[^\n]+\n*)+")


class DescriptionBlock(BlockLexer):
    grammar_class = DescriptionBlockGrammar

    default_rules = [
        "block_code",
        "list_block",
        "paragraph",
        "text",
        "newline",
    ]

    list_rules = ("block_code", "list_block", "text", "newline")

    # Need to extend this function since I need to modify this
    # https://github.com/lepture/mistune/blob/v0.8.4/mistune.py#L29
    def parse_block_code(self, m):
        # clean leading whitespace
        block_code_leading_pattern = re.compile(r"^ {3}", re.M)
        code = block_code_leading_pattern.sub("", m.group(0))
        self.tokens.append({"type": "code", "lang": None, "text": code})


class DescriptionInlineGrammar(InlineGrammar):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Rewrite to respect this convention:
        # https://github.com/CanonicalLtd/snap-squad/issues/936
        self.code = re.compile(r"^(`)([\S ]+)\1")


class DescriptionInline(InlineLexer):
    grammar_class = DescriptionInlineGrammar

    # Removed rules: inline_html, link, reflink
    default_rules = [
        "escape",
        "autolink",
        "url",
        "nolink",
        "double_emphasis",
        "emphasis",
        "code",
        "linebreak",
        "strikethrough",
        "text",
    ]
    inline_html_rules = [
        "escape",
        "autolink",
        "url",
        "nolink",
        "double_emphasis",
        "emphasis",
        "code",
        "linebreak",
        "strikethrough",
        "text",
    ]


renderer = Renderer()
parser = Markdown(
    renderer=renderer,
    block=DescriptionBlock(),
    inline=DescriptionInline(renderer=renderer),
)


def parse_markdown_description(content):
    return parser(content)
