import os
import json
from pathlib import Path
from typing import Dict
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class GPTClient:
    def __init__(self, model: str = "gpt-5"):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = model
        self.prompts_dir = Path(__file__).parent.parent / "prompts"
    
    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()
    
    def _call_gpt(self, system_message: str, user_prompt: str, use_json: bool = True) -> Dict:
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt}
        ]
        
        kwargs = {"model": self.model, "messages": messages}
        if use_json:
            kwargs["response_format"] = {"type": "json_object"}
        
        response = self.client.chat.completions.create(**kwargs)
        
        if use_json:
            return json.loads(response.choices[0].message.content)
        return {"response": response.choices[0].message.content}
    
    def categorize_note(self, title: str, body: str, existing_categories: list) -> Dict:
        prompt_template = self._load_prompt("categorize_note")
        user_prompt = prompt_template.format(
            title=title,
            body=body,
            existing_categories=', '.join(existing_categories) if existing_categories else 'None yet'
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that categorizes inspiration notes.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def classify_note(self, title: str, body: str) -> Dict:
        prompt_template = self._load_prompt("classify_note")
        user_prompt = prompt_template.format(
            title=title,
            body=body
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that classifies notes as inspiration or tasks.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def translate_to_planner(self, title: str, body: str) -> Dict:
        prompt_template = self._load_prompt("translate_to_planner")
        user_prompt = prompt_template.format(
            title=title,
            body=body
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that converts notes into planner tasks.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4
    
    def _chunk_notes(self, notes: list, max_tokens: int = 150000) -> list:
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for note in notes:
            note_text = f"{note.get('title', '')} {note.get('body', '')}"
            note_tokens = self._estimate_tokens(note_text)
            
            if current_tokens + note_tokens > max_tokens and current_chunk:
                chunks.append(current_chunk)
                current_chunk = [note]
                current_tokens = note_tokens
            else:
                current_chunk.append(note)
                current_tokens += note_tokens
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def organize_notes(self, notes: list, existing_folders: list) -> Dict:
        if not notes:
            return {"suggested_folders": [], "note_assignments": []}
        
        notes_text = "\n\n".join([
            f"ID: {note['id']}\nTitle: {note.get('title', 'Untitled')}\nBody: {note.get('body', '')}"
            for note in notes
        ])
        total_tokens = self._estimate_tokens(notes_text)
        
        if total_tokens <= 150000:
            return self._organize_notes_batch(notes, existing_folders)
        
        chunks = self._chunk_notes(notes, max_tokens=150000)
        all_suggested_folders = []
        all_assignments = []
        seen_folder_names = set(f["name"] for f in existing_folders)
        
        for chunk in chunks:
            result = self._organize_notes_batch(chunk, existing_folders)
            
            for folder in result.get("suggested_folders", []):
                if folder["name"] not in seen_folder_names:
                    all_suggested_folders.append(folder)
                    seen_folder_names.add(folder["name"])
            
            all_assignments.extend(result.get("note_assignments", []))
            
            for folder in result.get("suggested_folders", []):
                if folder not in existing_folders and folder["name"] not in [f["name"] for f in existing_folders]:
                    existing_folders.append(folder)
        
        return {
            "suggested_folders": all_suggested_folders,
            "note_assignments": all_assignments
        }
    
    def _organize_notes_batch(self, notes: list, existing_folders: list) -> Dict:
        prompt_template = self._load_prompt("organize_notes")
        
        existing_folders_text = "\n".join([
            f"- {folder.get('name', 'Unnamed')} (color: {folder.get('color', 'none')})"
            for folder in existing_folders
        ]) if existing_folders else "None yet"
        
        notes_text = "\n\n".join([
            f"ID: {note['id']}\nTitle: {note.get('title', 'Untitled')}\nBody: {note.get('body', '')}"
            for note in notes
        ])
        
        user_prompt = prompt_template.format(
            existing_folders=existing_folders_text,
            notes=notes_text
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that organizes notes into folders.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def chat_step1_select_folders(self, question: str, folders: list, 
                                  conversation_history: list) -> Dict:
        prompt_template = self._load_prompt("chat_step1_select_folders")
        
        folders_text = "\n".join([
            f"- ID: {folder['id']}, Name: {folder['name']}"
            for folder in folders
        ]) if folders else "No folders available"
        
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in conversation_history[-6:]
        ]) if conversation_history else "No previous conversation"
        
        user_prompt = prompt_template.format(
            question=question,
            folders=folders_text,
            conversation_history=history_text
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that helps find relevant notes to answer questions.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def chat_step2_answer(self, question: str, notes: list,
                         conversation_history: list) -> Dict:
        prompt_template = self._load_prompt("chat_step2_answer")
        
        notes_text = "\n\n".join([
            f"Note ID: {note['id']}\nTitle: {note.get('title', 'Untitled')}\nContent: {note.get('body', '')}"
            for note in notes
        ]) if notes else "No notes found in selected folders"
        
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in conversation_history[-6:]
        ]) if conversation_history else "No previous conversation"
        
        user_prompt = prompt_template.format(
            question=question,
            notes=notes_text,
            conversation_history=history_text
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that answers questions based on user's notes.",
            user_prompt=user_prompt,
            use_json=True
        )
