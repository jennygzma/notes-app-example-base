#!/usr/bin/env python3

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from migrations import migrate_planner_to_tasks


def main():
    print("=" * 60)
    print("Planner Items → Tasks Database Migration")
    print("=" * 60)
    print()
    print("This will migrate all planner items from planner_items.json")
    print("to the tasks table in the database.")
    print()
    print("Notes:")
    print("  - Only items WITHOUT google_task_id will be migrated")
    print("  - Items with invalid dates will be skipped")
    print("  - Safe to re-run (uses INSERT OR IGNORE)")
    print()
    
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("\nMigration cancelled.")
        return 0
    
    print("\nRunning migration...")
    print()
    
    try:
        result = migrate_planner_to_tasks()
        
        print("=" * 60)
        print("Migration Complete")
        print("=" * 60)
        print(f"  Migrated: {result['migrated']}")
        print(f"  Skipped:  {result['skipped']}")
        print(f"  Errors:   {len(result['errors'])}")
        print()
        
        if result['errors']:
            print("Errors encountered:")
            for error in result['errors']:
                print(f"  - {error}")
            print()
            return 1
        
        if result['migrated'] == 0:
            print("No new items to migrate.")
        else:
            print(f"Successfully migrated {result['migrated']} items!")
        
        return 0
        
    except Exception as e:
        print(f"\nFATAL ERROR: {str(e)}")
        print("\nMigration failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())