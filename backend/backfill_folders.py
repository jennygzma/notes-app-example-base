import json
from pathlib import Path

notes_path = Path(__file__).parent / "generated" / "notes.json"

with open(notes_path, 'r') as f:
    notes = json.load(f)

modified = False
for note in notes:
    if 'folder_id' not in note:
        note['folder_id'] = None
        modified = True

if modified:
    with open(notes_path, 'w') as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)
    print(f"✅ Backfilled {sum(1 for n in notes if n.get('folder_id') is None)} notes with folder_id=null")
else:
    print("✅ All notes already have folder_id field")