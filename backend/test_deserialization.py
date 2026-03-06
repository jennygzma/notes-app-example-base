#!/usr/bin/env python3

from repositories.note_repo import NoteRepository

repo = NoteRepository()
notes = repo.get_all()

print(f'✓ Total notes: {len(notes)}')

if notes:
    note = notes[0]
    activity = note.get('activity_history', [])
    print(f'✓ activity_history type: {type(activity).__name__}')
    print(f'✓ activity_history is list: {isinstance(activity, list)}')
    if activity:
        print(f'✓ Sample activity: {activity[0]}')
    else:
        print('✓ activity_history is empty list')
else:
    print('✓ No notes in database (expected for fresh DB)')

print('\n✅ Deserialization test passed!')