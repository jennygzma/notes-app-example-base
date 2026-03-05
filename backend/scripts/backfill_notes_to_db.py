import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
import json
import uuid
from datetime import datetime


def get_db_path():
    return Path(__file__).parent.parent / "generated" / "app.db"


def get_notes_json_path():
    return Path(__file__).parent.parent / "generated" / "notes.json"


def backfill_notes_to_db(dry_run=False):
    db_path = get_db_path()
    notes_json_path = get_notes_json_path()
    
    if not notes_json_path.exists():
        print(f"Notes file not found: {notes_json_path}")
        return {"notes_migrated": 0, "versions_created": 0, "skipped": 0, "errors": []}
    
    try:
        with open(notes_json_path, 'r') as f:
            notes = json.load(f)
    except Exception as e:
        return {"notes_migrated": 0, "versions_created": 0, "skipped": 0, "errors": [f"Failed to read notes.json: {str(e)}"]}
    
    print(f"Found {len(notes)} notes in {notes_json_path}")
    
    if dry_run:
        print("DRY RUN - No changes will be made to database")
        print(f"Would insert {len(notes)} notes and {len(notes)} versions")
        return {"notes_migrated": len(notes), "versions_created": len(notes), "skipped": 0, "errors": []}
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    notes_migrated = 0
    versions_created = 0
    skipped = 0
    errors = []
    
    with conn:
        for note in notes:
            try:
                note_id = note.get("id")
                if not note_id:
                    skipped += 1
                    continue
                
                title = note.get("title", "Untitled")
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
                    notes_migrated += 1
                    
                    version_id = str(uuid.uuid4())
                    version_cursor = conn.execute(
                        """
                        INSERT OR IGNORE INTO note_versions
                        (id, note_id, version_number, title, body, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (version_id, note_id, 1, title, body, created_at)
                    )
                    
                    if version_cursor.rowcount > 0:
                        versions_created += 1
                else:
                    skipped += 1
                    
            except Exception as e:
                errors.append(f"Failed to migrate note {note.get('id', 'unknown')}: {str(e)}")
    
    return {
        "notes_migrated": notes_migrated,
        "versions_created": versions_created,
        "skipped": skipped,
        "errors": errors
    }


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Backfill notes from JSON to SQLite database")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    args = parser.parse_args()
    
    result = backfill_notes_to_db(dry_run=args.dry_run)
    
    print(f"\nResults:")
    print(f"  Notes migrated: {result['notes_migrated']}")
    print(f"  Versions created: {result['versions_created']}")
    print(f"  Skipped: {result['skipped']}")
    
    if result['errors']:
        print(f"\nErrors ({len(result['errors'])}):")
        for error in result['errors']:
            print(f"  - {error}")