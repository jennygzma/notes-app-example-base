from repositories.inspiration_repo import InspirationRepository

def seed_initial_categories():
    repo = InspirationRepository()
    
    initial_categories = [
        "song covers",
        "songs written",
        "art ideas",
        "NYC activities",
        "travel places"
    ]
    
    existing_categories = repo.get_categories()
    existing_names = [c['name'] for c in existing_categories]
    
    for category_name in initial_categories:
        if category_name not in existing_names:
            repo.create_category(
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
