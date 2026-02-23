import json
from pathlib import Path
from datetime import datetime

def backfill_note_activities():
    notes_path = Path(__file__).parent / "generated" / "notes.json"
    
    if not notes_path.exists():
        print("No notes.json found. Nothing to backfill.")
        return
    
    with open(notes_path, 'r') as f:
        notes = json.load(f)
    
    updated_count = 0
    
    for note in notes:
        if "activity_history" not in note or not note["activity_history"]:
            note["activity_history"] = [
                {
                    "type": "created",
                    "timestamp": note.get("created_at", datetime.utcnow().isoformat()),
                    "details": {}
                }
            ]
            updated_count += 1
    
    with open(notes_path, 'w') as f:
        json.dump(notes, f, indent=2)
    
    print(f"Backfilled {updated_count} notes with 'created' activity.")

if __name__ == "__main__":
    backfill_note_activities()