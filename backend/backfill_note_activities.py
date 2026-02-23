from pathlib import Path
from repositories.note_repo import NoteRepository

def backfill_note_activities():
    repo = NoteRepository()
    notes = repo._read_json()
    
    updated_count = 0
    skipped_count = 0
    
    for note in notes:
        if 'activity_history' not in note:
            note['activity_history'] = []
        
        has_created = any(
            activity.get('type') == 'created' 
            for activity in note.get('activity_history', [])
        )
        
        if not has_created:
            created_activity = {
                'type': 'created',
                'timestamp': note['created_at'],
                'details': {}
            }
            note['activity_history'].insert(0, created_activity)
            updated_count += 1
        else:
            skipped_count += 1
    
    repo._write_json(notes)
    
    print(f"Backfill complete:")
    print(f"  - Updated: {updated_count} notes")
    print(f"  - Skipped: {skipped_count} notes (already had 'created' activity)")
    print(f"  - Total: {len(notes)} notes")

if __name__ == "__main__":
    backfill_note_activities()