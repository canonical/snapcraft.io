import subprocess
import tempfile
from pathlib import Path

from scour import scour

BASE_ROOT = Path.cwd()

SRC_ROOT = (BASE_ROOT / "static" / "images" / "badges_editable").resolve()
OUT_ROOT = (BASE_ROOT / "static" / "images" / "badges").resolve()


def minify_svg(svg_text: str) -> str:
    opts = scour.sanitizeOptions()
    opts.strip_xml_prolog = True
    opts.remove_metadata = True
    opts.strip_comments = True
    opts.enable_viewboxing = False
    opts.strip_xml_space_attribute = True
    opts.indent_type = "none"
    opts.newlines = False
    opts.digits = 3
    opts.shorten_ids = True
    return scour.scourString(svg_text, opts)


def outline_svg(svg_bytes: bytes) -> bytes:
    with tempfile.TemporaryDirectory() as d:
        src = Path(d, "in.svg")
        dst = Path(d, "out.svg")
        src.write_bytes(svg_bytes)
        subprocess.run(
            ["inkscape", str(src),
             "--export-text-to-path",
             "--export-plain-svg",
             "-o", str(dst)],
            check=True, timeout=60,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return dst.read_bytes()


def main():
    folders = [p for p in SRC_ROOT.iterdir()
               if p.is_dir() and p.resolve() != OUT_ROOT and not p.name.startswith(".")]

    ok, failed = 0, []
    for folder in sorted(folders):
        for svg in folder.rglob("*.svg"):
            rel = svg.relative_to(SRC_ROOT)
            out_path = OUT_ROOT / rel
            try:
                outlined = outline_svg(svg.read_bytes())
                minified = minify_svg(outlined.decode("utf-8"))
                out_path.parent.mkdir(parents=True, exist_ok=True)
                out_path.write_text(minified, encoding="utf-8")
                ok += 1
                print(f"GENERATED for {rel}")
            except Exception as e:
                failed.append((rel, e))
                print(f"FAILED for {rel}: {e}")

    print(f"\nDone: {ok} converted, {len(failed)} failed -> {OUT_ROOT}")


if __name__ == "__main__":
    main()