from typing import Dict, List
from repositories.link_repo import LinkRepository

class LinkService:
    def __init__(self):
        self.repo = LinkRepository()

    def create_link(self, note_id: str, planner_item_id: str) -> Dict:
        return self.repo.create(note_id, planner_item_id)
    
    def get_links_by_note(self, note_id: str) -> List[Dict]:
        return self.repo.get_by_note_id(note_id)
    
    def get_links_by_planner_item(self, planner_item_id: str) -> List[Dict]:
        return self.repo.get_by_planner_item_id(planner_item_id)
    
    def delete_link(self, link_id: str) -> bool:
        return self.repo.delete(link_id)
