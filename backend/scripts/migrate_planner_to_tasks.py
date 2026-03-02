#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from migrations import migrate_planner_to_tasks


def main():
    print("=" * 60)
    print("Planner Items → Tasks Migration")
    print("=" * 60)
    print()
    print("This will migrate planner_items.json to the tasks table.")
    print("Only items without google_task_id will be migrated.")
    print()
    
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    
    if response not in ["yes", "y"]:
        print("Migration cancelled.")
        sys.exit(0)
    
    print()
    print("Running migration...")
    print()
    
    try:
        result = migrate_planner_to_tasks()
        
        print("=" * 60)
        print("Migration Complete!")
        print("=" * 60)
        print(f"✓ Migrated: {result['migrated']} items")
        print(f"⊘ Skipped: {result['skipped']} items")
        print()
        
        if result['migrated'] > 0:
            print("Successfully migrated planner items to tasks table.")
        else:
            print("No items were migrated (all items already exist or were skipped).")
        
        sys.exit(0)
    
    except Exception as e:
        print("=" * 60)
        print("Migration Failed!")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()