import json
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    kb_path = repo_root / ".zoro" / "rules" / "structured" / "knowledge_base.json"
    if not kb_path.exists():
        print(f"Knowledge base not found: {kb_path}")
        return 1

    out_path = repo_root / "knowledge_base.md"
    if len(sys.argv) > 1:
        out_path = Path(sys.argv[1]).expanduser()

    kb = json.loads(kb_path.read_text())
    items = [i for i in kb.get("items", []) if i.get("type") == "rule"]
    items.sort(key=lambda x: (x.get("category", ""), x.get("title", "")))

    lines = []
    lines.append("# Knowledge Base")
    lines.append("")
    lines.append(f"Source: {kb_path}")
    lines.append(f"Total rules: {len(items)}")
    lines.append("")

    for item in items:
        lines.append(f"## {item.get('title','')}")
        lines.append(f"- Category: {item.get('category','')}")
        lines.append(f"- Content: {item.get('content','')}")
        lines.append(f"- Context: {item.get('context','')}")
        lines.append(f"- Evidence: {item.get('evidence','')}")
        lines.append(f"- Confidence: {item.get('confidence','')}")
        lines.append(f"- Decay: {item.get('decay','')}")
        lines.append(f"- Item ID: {item.get('item_id','')}")
        lines.append(f"- Source: {item.get('source_file','')}")
        lines.append(f"- Created At: {item.get('created_at','')}")
        lines.append("")

    out_path.write_text("\n".join(lines))
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
