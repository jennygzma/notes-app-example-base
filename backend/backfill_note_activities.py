#!/usr/bin/env python3
"""
Backfill script to add 'created' activity to existing notes.
This script reads all notes and adds an initial 'created' activity
to their activity_history using the created_at timestamp.
"""
import json
from pathlib import Path


def backfill_note_activities():
    """Add 'created' activity to all existing notes"""
    notes_file = Path("generated/notes.json")
    
    if not notes_file.exists():
        print(f"Notes file not found: {notes_file}")
        return
    
    # Read existing notes
    with open(notes_file, 'r') as f:
        notes = json.load(f)
    
    updated_count = 0
    
    for note in notes:
        # Check if activity_history exists and is empty
        if 'activity_history' not in note or len(note['activity_history']) == 0:
            # Add initial 'created' activity
            note['activity_history'] = [{
                'type': 'created',
                'timestamp': note['created_at'],
                'details': {}
            }]
            updated_count += 1
    
    # Write back to file
    with open(notes_file, 'w') as f:
        json.dump(notes, f, indent=2)
    
    print(f"✅ Backfill complete: Updated {updated_count} notes")
    print(f"📝 Total notes: {len(notes)}")


if __name__ == "__main__":
    backfill_note_activities()