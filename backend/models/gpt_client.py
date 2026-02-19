import os
import json
from pathlib import Path
from typing import Dict, List
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
    
    def _chunk_notes(self, notes: List[Dict], max_tokens: int = 150000) -> List[List[Dict]]:
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for note in notes:
            note_text = f"Note ID: {note['id']}\nTitle: {note['title']}\nBody: {note.get('body', '')}\n\n"
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
    
    def _merge_organize_results(self, results: List[Dict]) -> Dict:
        merged_folders = {}
        all_assignments = []
        
        for result in results:
            for folder in result.get('suggested_folders', []):
                folder_name_lower = folder['name'].lower()
                if folder_name_lower not in merged_folders:
                    merged_folders[folder_name_lower] = folder
            
            all_assignments.extend(result.get('note_assignments', []))
        
        return {
            'suggested_folders': list(merged_folders.values()),
            'note_assignments': all_assignments
        }
    
    def organize_notes(self, notes: list, existing_folders: list) -> Dict:
        if not notes:
            return {'suggested_folders': [], 'note_assignments': []}
        
        prompt_template = self._load_prompt("organize_notes")
        existing_folders_str = ', '.join([f['name'] for f in existing_folders]) if existing_folders else 'None'
        
        prompt_base = prompt_template.split('{notes}')[0]
        base_tokens = self._estimate_tokens(prompt_base + existing_folders_str)
        
        max_notes_tokens = 150000 - base_tokens
        
        note_chunks = self._chunk_notes(notes, max_notes_tokens)
        
        if len(note_chunks) == 1:
            notes_str = '\n\n'.join([
                f"Note ID: {note['id']}\nTitle: {note['title']}\nBody: {note.get('body', '')}"
                for note in notes
            ])
            
            user_prompt = prompt_template.format(
                existing_folders=existing_folders_str,
                notes=notes_str
            )
            
            return self._call_gpt(
                system_message="You are an intelligent note organization assistant.",
                user_prompt=user_prompt,
                use_json=True
            )
        
        results = []
        for chunk in note_chunks:
            notes_str = '\n\n'.join([
                f"Note ID: {note['id']}\nTitle: {note['title']}\nBody: {note.get('body', '')}"
                for note in chunk
            ])
            
            user_prompt = prompt_template.format(
                existing_folders=existing_folders_str,
                notes=notes_str
            )
            
            result = self._call_gpt(
                system_message="You are an intelligent note organization assistant.",
                user_prompt=user_prompt,
                use_json=True
            )
            results.append(result)
        
        return self._merge_organize_results(results)
