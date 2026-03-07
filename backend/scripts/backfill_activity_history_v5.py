import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
import json
from datetime import datetime, timezone


def backfill_activity_history():
    db_path = Path(__file__).parent.parent / "generated" / "app.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return {"updated": 0, "errors": []}
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    updated = 0
    errors = []
    
    try:
        with conn:
            rows = conn.execute("SELECT id, activity_history FROM notes").fetchall()
            
            for row in rows:
                note_id = row["id"]
                activity_history_raw = row["activity_history"]
                
                try:
                    if activity_history_raw:
                        try:
                            activities = json.loads(activity_history_raw)
                        except (json.JSONDecodeError, TypeError):
                            activities = []
                    else:
                        activities = []
                    
                    modified = False
                    for activity in activities:
                        if activity.get("type") == "email_sent":
                            if "timestamp" not in activity or not activity["timestamp"]:
                                activity["timestamp"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                                modified = True
                            
                            if "details" not in activity:
                                activity["details"] = {}
                            
                            if activity["details"] and "sent_at" in activity["details"]:
                                sent_at = activity["details"]["sent_at"]
                                if sent_at and not sent_at.endswith("Z"):
                                    try:
                                        dt = datetime.fromisoformat(sent_at.replace("Z", "+00:00"))
                                        utc_dt = dt.astimezone(timezone.utc)
                                        activity["details"]["sent_at"] = utc_dt.isoformat().replace("+00:00", "Z")
                                        modified = True
                                    except (ValueError, AttributeError):
                                        pass
                    
                    if modified:
                        normalized_json = json.dumps(activities)
                        conn.execute(
                            "UPDATE notes SET activity_history = ? WHERE id = ?",
                            (normalized_json, note_id)
                        )
                        updated += 1
                        
                except Exception as e:
                    errors.append(f"Failed to process note {note_id}: {str(e)}")
                    
    except Exception as e:
        errors.append(f"Database error: {str(e)}")
    finally:
        conn.close()
    
    return {"updated": updated, "errors": errors}


if __name__ == "__main__":
    result = backfill_activity_history()
    print(f"Backfill completed:")
    print(f"  Updated: {result['updated']} notes")
    if result['errors']:
        print(f"  Errors: {len(result['errors'])}")
        for error in result['errors']:
            print(f"    - {error}")
    else:
        print("  No errors")