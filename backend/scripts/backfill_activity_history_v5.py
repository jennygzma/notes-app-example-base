#!/usr/bin/env python3

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any


def get_db_path() -> Path:
    return Path(__file__).parent.parent / "generated" / "app.db"


def normalize_activity_history(activity_history: Any) -> List[Dict[str, Any]]:
    if not activity_history:
        return []
    
    if isinstance(activity_history, str):
        try:
            activity_history = json.loads(activity_history)
        except json.JSONDecodeError:
            return []
    
    if not isinstance(activity_history, list):
        return []
    
    normalized = []
    for activity in activity_history:
        if not isinstance(activity, dict):
            continue
        
        activity_type = activity.get("type")
        if activity_type not in ["created", "updated", "moved", "email_sent"]:
            continue
        
        normalized_activity = {
            "type": activity_type,
            "timestamp": activity.get("timestamp", datetime.utcnow().isoformat() + "Z"),
            "details": activity.get("details", {})
        }
        
        if activity_type == "email_sent":
            if "sent_at" not in normalized_activity["details"]:
                normalized_activity["details"]["sent_at"] = normalized_activity["timestamp"]
        
        normalized.append(normalized_activity)
    
    return normalized


def backfill_activity_history() -> Dict[str, Any]:
    db_path = get_db_path()
    
    if not db_path.exists():
        return {"updated": 0, "skipped": 0, "errors": ["Database file does not exist"]}
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    updated = 0
    skipped = 0
    errors = []
    
    try:
        with conn:
            notes = conn.execute("SELECT id, activity_history FROM notes").fetchall()
            
            for note in notes:
                note_id = note["id"]
                raw_history = note["activity_history"]
                
                try:
                    normalized = normalize_activity_history(raw_history)
                    
                    if raw_history and isinstance(raw_history, str):
                        try:
                            parsed = json.loads(raw_history)
                            if parsed == normalized:
                                skipped += 1
                                continue
                        except json.JSONDecodeError:
                            pass
                    elif raw_history == normalized:
                        skipped += 1
                        continue
                    
                    normalized_json = json.dumps(normalized)
                    conn.execute(
                        "UPDATE notes SET activity_history = ? WHERE id = ?",
                        (normalized_json, note_id)
                    )
                    updated += 1
                    
                except Exception as e:
                    errors.append(f"Failed to backfill note {note_id}: {str(e)}")
        
        return {"updated": updated, "skipped": skipped, "errors": errors}
        
    except Exception as e:
        errors.append(f"Database error: {str(e)}")
        return {"updated": updated, "skipped": skipped, "errors": errors}
    finally:
        conn.close()


def main():
    print("=" * 60)
    print("Activity History Backfill (Schema v5)")
    print("=" * 60)
    print()
    print("This will normalize activity_history JSON for all notes:")
    print("  - Parse activity_history if stored as string")
    print("  - Validate activity types")
    print("  - Ensure email_sent activities have sent_at timestamps")
    print("  - Store as normalized JSON")
    print()
    print("Safe to re-run (only updates changed records)")
    print()
    
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("\nBackfill cancelled.")
        return 0
    
    print("\nRunning backfill...")
    print()
    
    try:
        result = backfill_activity_history()
        
        print("=" * 60)
        print("Backfill Complete")
        print("=" * 60)
        print(f"  Updated:  {result['updated']}")
        print(f"  Skipped:  {result['skipped']}")
        print(f"  Errors:   {len(result['errors'])}")
        print()
        
        if result['errors']:
            print("Errors encountered:")
            for error in result['errors']:
                print(f"  - {error}")
            print()
            return 1
        
        if result['updated'] == 0:
            print("No records needed updating.")
        else:
            print(f"Successfully updated {result['updated']} records!")
        
        return 0
        
    except Exception as e:
        print(f"\nFATAL ERROR: {str(e)}")
        print("\nBackfill failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())