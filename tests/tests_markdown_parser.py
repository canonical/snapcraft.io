import unittest

from webapp.markdown import parse_markdown_description


class TestMarkdownParser(unittest.TestCase):
    """This class tests the custom parser for the snap description. This
    parser allows only a limited amount of tags. We want a lot of tests for
    it to make sure on upgrades we don't lose the custom tags that we want
    to keep.
    """

    def test_parse_title(self):
        """Title conversion shouldn't work
        """
        markdown = "# title"
        result = parse_markdown_description(markdown)
        expected_result = "<p># title</p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_urls(self):
        """Literal URLs auto-link https://foo.bar
        """
        markdown = "https://toto.space"
        result = parse_markdown_description(markdown)
        expected_result = (
            '<p><a href="https://toto.space">https://toto.space</a></p>\n'
        )

        self.assertEqual(result, expected_result)

    def test_parse_urls_title(self):
        """URLs with title [title for the link](https://foo.bar)
        """
        markdown = "[toto](https://toto.space)"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<p>"
            '[toto](<a href="https://toto.space">https://toto.space</a>)'
            "</p>\n"
        )

        self.assertEqual(result, expected_result)

    def test_parse_italics(self):
        """Italics (_foo_)
        """
        markdown = "_text_"
        result = parse_markdown_description(markdown)
        expected_result = "<p><em>text</em></p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_bold(self):
        """Bold (**foo**)
        """
        markdown = "**text**"
        result = parse_markdown_description(markdown)
        expected_result = "<p><strong>text</strong></p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_paragraph_merging(self):
        """Paragraph merging (consecutive lines are joined)
        """
        markdown = "this is\n a paragraph"
        result = parse_markdown_description(markdown)
        expected_result = "<p>this is\n a paragraph</p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_paragraph(self):
        """Paragraphs
        """
        markdown = "paragraph 1\n\n paragraph 2"
        result = parse_markdown_description(markdown)
        expected_result = "<p>paragraph 1</p>\n<p>paragraph 2</p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_text(self):
        """Text conversion works
        """
        markdown = "text"
        result = parse_markdown_description(markdown)
        expected_result = "<p>text</p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_triple_fences(self):
        """Code (text blocks inside  ``` pairs)
        """
        markdown = "```code block```"
        result = parse_markdown_description(markdown)
        expected_result = "<p>```code block```</p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_single_fences(self):
        """Code (text blocks inside  ` pairs)
        """
        markdown = "`code block`"
        result = parse_markdown_description(markdown)
        expected_result = "<p><code>code block</code></p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_code_block_single_line(self):
        """Code with three space indentation
        """
        markdown = "   code"
        result = parse_markdown_description(markdown)
        expected_result = "<pre><code>code\n</code></pre>\n"

        self.assertEqual(result, expected_result)

    def test_parse_code_block_multiple_line(self):
        """Code with four space indentation
        """
        markdown = "    code\n    code line 2"
        result = parse_markdown_description(markdown)
        expected_result = "<pre><code> code\n code line 2\n</code></pre>\n"

        self.assertEqual(result, expected_result)

    def test_parse_code_block_multiple_line_tree_spaces(self):
        """Code with three space indentation
        """
        markdown = "   code\n   code line 2"
        result = parse_markdown_description(markdown)
        expected_result = "<pre><code>code\ncode line 2\n</code></pre>\n"

        self.assertEqual(result, expected_result)

    def test_parse_code_line(self):
        """Code (text blocks inside `)
        """
        markdown = "`code line`"
        result = parse_markdown_description(markdown)
        expected_result = "<p><code>code line</code></p>\n"

        self.assertEqual(result, expected_result)

    def test_parse_multiple_code_line(self):
        """Code (text blocks inside `)
        """
        markdown = "`code line` and `code line`"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<p><code>code line</code> and <code>code line</code></p>\n"
        )

        self.assertEqual(result, expected_result)

    def test_parse_list(self):
        """Lists (* Foo)
        """
        markdown = "* item \n* item \n* item \n"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<ul>\n<li>item </li>\n<li>item </li>\n<li>item </li>\n</ul>\n"
        )

        self.assertEqual(result, expected_result)

    def test_parse_list_special_char(self):
        """Lists (• Foo)
        """
        markdown = "• item \n• item \n• item \n"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<ul>\n<li>item </li>\n<li>item </li>\n<li>item </li>\n</ul>\n"
        )

        self.assertEqual(result, expected_result)

    def test_parse_list_ordered(self):
        """Lists (* Foo)
        """
        markdown = "1. item \n2. item \n3. item \n"
        result = parse_markdown_description(markdown)
        expected_result = (
            "<ol>\n<li>item </li>\n<li>item </li>\n<li>item </li>\n</ol>\n"
        )

        self.assertEqual(result, expected_result)

    def test_parse_image_link(self):
        """Image link is converted into a simple link
        """
        markdown = "![image](link.png)"
        result = parse_markdown_description(markdown)
        expected_result = "<p>" + markdown + "</p>\n"

        self.assertEqual(result, expected_result)
