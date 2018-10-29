import markdown

md = markdown.Markdown()


def convert_md(text):
    md.reset()
    return md.convert(text)
