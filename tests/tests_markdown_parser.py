import unittest

from webapp.markdown import parse_markdown_description


class TestMarkdownParser(unittest.TestCase):
    """This class tests the custom parser for the snap description. This
    parser allows only a limited amount of tags. We want a lot of tests for
    it to make sure on upgrades we don't loose the custom tags that we want
    to keep.

    List of approved markdown tag allowed:

    * Code (text blocks inside ` or ``` pairs)
    * Lists (* Foo)
    * Italics (_foo_)
    * Bold (**foo**)
    * Paragraph merging (consecutive lines are joined)
    * Literal URLs auto-link https://foo.bar
    * URLs with title [title for the link](https://foo.bar)
    """

    def test_parse_title(self):
        """Title conversion shouldn't work
        """
        markdown = "# title"
        result = parse_markdown_description(markdown)
        expected_result = "<p># title</p>\n"

        assert result == expected_result

    def test_parse_urls(self):
        """Literal URLs auto-link https://foo.bar
        """
        markdown = "https://toto.space"
        result = parse_markdown_description(markdown)
        expected_result = (
            '<p><a href="https://toto.space">https://toto.space</a></p>\n'
        )

        assert result == expected_result

    def test_parse_urls_title(self):
        """URLs with title [title for the link](https://foo.bar)
        """
        markdown = "[toto](https://toto.space)"
        result = parse_markdown_description(markdown)
        expected_result = '<p><a href="https://toto.space">toto</a></p>\n'

        assert result == expected_result

    def test_parse_italics(self):
        """Italics (_foo_)
        """
        markdown = "_text_"
        result = parse_markdown_description(markdown)
        expected_result = "<p><em>text</em></p>\n"

        assert result == expected_result

    def test_parse_bold(self):
        """Bold (**foo**)
        """
        markdown = "**text**"
        result = parse_markdown_description(markdown)
        expected_result = "<p><strong>text</strong></p>\n"

        assert result == expected_result

    def test_parse_paragraph_merging(self):
        """Paragraph merging (consecutive lines are joined)
        """
        markdown = "this is\n a paragraph"
        result = parse_markdown_description(markdown)
        expected_result = "<p>this is\n a paragraph</p>\n"

        assert result == expected_result

    def test_parse_paragraph(self):
        """Paragraphs
        """
        markdown = "paragraph 1\n\n paragraph 2"
        result = parse_markdown_description(markdown)
        expected_result = "<p>paragraph 1</p>\n<p>paragraph 2</p>\n"

        assert result == expected_result

    def test_parse_text(self):
        """Text conversion works
        """
        markdown = "text"
        result = parse_markdown_description(markdown)
        expected_result = "<p>text</p>\n"

        assert result == expected_result

    def test_parse_code_block(self):
        """Code (text blocks inside ` or ``` pairs)
        """
        markdown = "```code block```"
        result = parse_markdown_description(markdown)
        expected_result = "<p><code>code block</code></p>\n"

        assert result == expected_result

    def test_parse_code_line(self):
        """Code (text blocks inside ` or ``` pairs)
        """
        markdown = "`code line`"
        result = parse_markdown_description(markdown)
        expected_result = "<p><code>code line</code></p>\n"

        assert result == expected_result

    def test_parse_list(self):
        """Lists (* Foo)
        """
        markdown = "* item \n* item \n* item \n"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<ul>\n<li>item </li>\n<li>item </li>\n<li>item </li>\n</ul>\n"
        )

        assert result == expected_result

    def test_parse_list_special_char(self):
        """Lists (• Foo)
        """
        markdown = "• item \n• item \n• item \n"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<ul>\n<li>item </li>\n<li>item </li>\n<li>item </li>\n</ul>\n"
        )

        assert result == expected_result

    def test_parse_list_ordered(self):
        """Lists (* Foo)
        """
        markdown = "1. item \n2. item \n3. item \n"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<ol>\n<li>item </li>\n<li>item </li>\n<li>item </li>\n</ol>\n"
        )

        assert result == expected_result

    def test_parse_image_link(self):
        """Image link is converted into a simple link
        """
        markdown = "![image](link.png)"
        result = parse_markdown_description(markdown)
        expected_result = '<p>!<a href="link.png">image</a></p>\n'

        assert result == expected_result
