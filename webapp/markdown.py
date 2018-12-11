from mistune import BlockGrammar, BlockLexer, Markdown, _pure_pattern
import re


class DescriptionGrammar(BlockGrammar):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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
        "block_code",
        "list_block",
        "paragraph",
        "text",
        "newline",
    ]

    list_rules = ("block_code", "list_block", "text", "newline")


parser = Markdown(
    parse_block_html=True, parse_inline_html=True, block=DescriptionBlock()
)


def parse_markdown_description(content):
    return parser(content)
