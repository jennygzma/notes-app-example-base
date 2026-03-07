import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime


def migrate_notes_to_sqlite():
    db_path = Path(__file__).parent.parent / "generated" / "app.db"
    notes_file = Path(__file__).parent.parent / "generated" / "notes.json"
    
    if not notes_file.exists():
        print("No notes.json file found. Nothing to migrate.")
        return {"migrated": 0, "skipped": 0, "errors": []}
    
    try:
        with open(notes_file, 'r') as f:
            notes_data = json.load(f)
    except Exception as e:
        return {"migrated": 0, "skipped": 0, "errors": [f"Failed to read notes.json: {str(e)}"]}
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    migrated_notes = 0
    migrated_versions = 0
    skipped = 0
    errors = []
    
    with conn:
        for note in notes_data:
            try:
                note_id = note.get("id")
                if not note_id:
                    skipped += 1
                    continue
                
                existing = conn.execute(
                    "SELECT id FROM notes WHERE id = ?", (note_id,)
                ).fetchone()
                
                if existing:
                    skipped += 1
                    continue
                
                title = note.get("title", "")
                body = note.get("body", "")
                folder_id = note.get("folder_id")
                is_inspiration = 1 if note.get("is_inspiration", False) else 0
                is_analyzed = 1 if note.get("is_analyzed", False) else 0
                created_at = note.get("created_at", datetime.utcnow().isoformat() + "Z")
                updated_at = note.get("updated_at", datetime.utcnow().isoformat() + "Z")
                activity_history = json.dumps(note.get("activity_history", []))
                
                conn.execute(
                    """
                    INSERT INTO notes 
                    (id, title, body, folder_id, is_inspiration, is_analyzed, created_at, updated_at, activity_history)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (note_id, title, body, folder_id, is_inspiration, is_analyzed, created_at, updated_at, activity_history)
                )
                migrated_notes += 1
                
                version_id = str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO note_versions
                    (id, note_id, version_number, title, body, folder_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (version_id, note_id, 1, title, body, folder_id, created_at)
                )
                migrated_versions += 1
                
            except Exception as e:
                errors.append(f"Failed to migrate note {note.get('id', 'unknown')}: {str(e)}")
    
    print(f"Migration complete:")
    print(f"  - Migrated {migrated_notes} notes")
    print(f"  - Created {migrated_versions} initial versions")
    print(f"  - Skipped {skipped} notes (already exist)")
    if errors:
        print(f"  - Errors: {len(errors)}")
        for error in errors:
            print(f"    - {error}")
    
    return {
        "migrated_notes": migrated_notes,
        "migrated_versions": migrated_versions,
        "skipped": skipped,
        "errors": errors
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path
    
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))
    
    from migrations import run_migrations
    
    print("Running database migrations...")
    version = run_migrations()
    print(f"Database is at schema version {version}")
    
    print("\nMigrating notes from JSON to SQLite...")
    result = migrate_notes_to_sqlite()
    
    if result["errors"]:
        exit(1)
    else:
        exit(0)