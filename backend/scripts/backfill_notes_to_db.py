import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
import json
import uuid
from datetime import datetime


def backfill_notes():
    db_path = Path(__file__).parent.parent / "generated" / "app.db"
    notes_json_path = Path(__file__).parent.parent / "generated" / "notes.json"
    
    if not notes_json_path.exists():
        print("No notes.json file found. Nothing to backfill.")
        return {"migrated": 0, "errors": []}
    
    with open(notes_json_path, 'r') as f:
        notes = json.load(f)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    migrated_notes = 0
    migrated_versions = 0
    errors = []
    
    with conn:
        for note in notes:
            try:
                note_id = note.get("id")
                title = note.get("title", "")
                body = note.get("body", "")
                is_inspiration = 1 if note.get("is_inspiration", False) else 0
                is_analyzed = 1 if note.get("is_analyzed", False) else 0
                folder_id = note.get("folder_id")
                created_at = note.get("created_at", datetime.utcnow().isoformat() + "Z")
                updated_at = note.get("updated_at", datetime.utcnow().isoformat() + "Z")
                
                cursor = conn.execute(
                    """
                    INSERT OR IGNORE INTO notes 
                    (id, title, body, is_inspiration, is_analyzed, folder_id, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (note_id, title, body, is_inspiration, is_analyzed, folder_id, created_at, updated_at)
                )
                
                if cursor.rowcount > 0:
                    migrated_notes += 1
                    
                    version_id = str(uuid.uuid4())
                    tags_json = json.dumps([])
                    
                    conn.execute(
                        """
                        INSERT INTO note_versions 
                        (version_id, note_id, title, content, folder_id, tags, created_at, version_number) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (version_id, note_id, title, body, folder_id, tags_json, created_at, 1)
                    )
                    migrated_versions += 1
                    
            except Exception as e:
                errors.append(f"Failed to migrate note {note.get('id', 'unknown')}: {str(e)}")
    
    print(f"Migration complete!")
    print(f"Notes migrated: {migrated_notes}")
    print(f"Versions created: {migrated_versions}")
    if errors:
        print(f"Errors: {len(errors)}")
        for error in errors:
            print(f"  - {error}")
    
    return {"migrated_notes": migrated_notes, "migrated_versions": migrated_versions, "errors": errors}


if __name__ == "__main__":
    backfill_notes()