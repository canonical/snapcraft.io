from mistune import Markdown, BlockLexer


class DescriptionBlock(BlockLexer):

    default_rules = ["block_code", "list_block", "paragraph", "text"]

    list_rules = (
        "block_code",
        "list_block",
        "text",
        "list",
        "list_item",
        "paragraph",
        "autolink",
        "link",
    )


parser = Markdown(
    parse_block_html=True, parse_inline_html=True, block=DescriptionBlock()
)


def parse_markdown_description(content):
    return parser(content)
