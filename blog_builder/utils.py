from mistletoe.span_token import RawText, SpanToken, Strong, Emphasis, Link, InlineCode
from mistletoe.block_token import BlockToken, Heading, CodeFence
from mistletoe import Document, HtmlRenderer
import subprocess


def origin(file):
    result = subprocess.run(
        ["git", "log", "--follow", "--format=%ad", "--date", "unix", str(file)],
        capture_output=True,
    )
    output = result.stdout.decode().strip()
    if output:
        return int(output.strip().split("\n")[-1])
    else:
        return float("inf")


def commit_order(files):
    return sorted(files, key=origin, reverse=True)


def unique(l):
    seen = set()
    for item in l:
        if item not in seen:
            seen.add(item)
            yield item


def title(path):
    return " ".join(path.stem.split("-")).title()


def update_text(token: SpanToken):
    if isinstance(token, Strong):
        assert token.children
        assert isinstance(token.children, list)

        token.children.insert(0, RawText("**"))
        token.children.append(RawText("**"))
    elif isinstance(token, Emphasis):
        assert token.children
        assert isinstance(token.children, list)

        token.children.insert(0, RawText("_"))
        token.children.append(RawText("_"))
    elif isinstance(token, Link):
        assert token.children
        assert isinstance(token.children, list)

        token.children.insert(0, RawText("["))
        token.children.append(RawText("](" + token.target + ")"))
    elif isinstance(token, InlineCode):
        assert token.children
        assert isinstance(token.children, tuple)

        # Assumption: A inline code span has only one child, which is a RawText
        assert len(token.children) == 1
        assert isinstance(token.children[0], RawText)

        token.children[0].content = f"`{token.children[0].content}`"

    if hasattr(token, "children") and token.children:
        for child in token.children:
            assert isinstance(child, SpanToken)
            update_text(child)


def update_block(token: BlockToken):
    if not token.children:
        return

    for child in token.children:
        if isinstance(child, Heading):
            assert child.children
            assert isinstance(child.children, list)

            child.children.insert(0, RawText("#" * child.level + " "))
            update_block(child)
        if isinstance(child, CodeFence):
            assert child.children
            assert isinstance(child.children, tuple)

            # Assumption: A code fence block has only one child, which is a RawText
            assert len(child.children) == 1
            assert isinstance(child.children[0], RawText)

            child.children[0].content = (
                "```" + child.language + "\n" + child.children[0].content + "```"
            )
        elif isinstance(child, BlockToken):
            update_block(child)
        elif isinstance(child, SpanToken):
            update_text(child)
        else:
            assert False


def markupsidedown(text: str) -> str:
    with HtmlRenderer() as renderer:
        doc = Document(text)
        update_block(doc)
        return renderer.render(doc)
