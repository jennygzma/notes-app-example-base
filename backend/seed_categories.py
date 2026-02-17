from models.storage import LocalStorage

def seed_initial_categories():
    storage = LocalStorage()
    
    initial_categories = [
        "song covers",
        "songs written",
        "art ideas",
        "NYC activities",
        "travel places"
    ]
    
    existing_categories = storage.get_categories()
    existing_names = [c['name'] for c in existing_categories]
    
    for category_name in initial_categories:
        if category_name not in existing_names:
            storage.create_category(
                name=category_name,
                status="active",
                discovered_by="user"
            )
            print(f"Created category: {category_name}")
        else:
            print(f"Category already exists: {category_name}")
    
    print("\nSeeding complete!")

if __name__ == '__main__':
    seed_initial_categories()
