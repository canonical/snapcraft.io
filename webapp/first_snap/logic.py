import markdown

md = markdown.Markdown(extensions=["extra"])


def convert_md(text):
    md.reset()
    return md.convert(text)
