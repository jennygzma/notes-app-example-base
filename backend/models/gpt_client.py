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
            note_text = json.dumps(note, indent=2)
            note_tokens = self._estimate_tokens(note_text)
            
            if current_tokens + note_tokens > max_tokens and current_chunk:
                chunks.append(current_chunk)
                current_chunk = []
                current_tokens = 0
            
            current_chunk.append(note)
            current_tokens += note_tokens
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def _merge_organization_results(self, results: list) -> Dict:
        all_folders = []
        all_assignments = []
        seen_folder_names = set()
        
        for result in results:
            for folder in result.get("suggested_folders", []):
                if folder["name"] not in seen_folder_names:
                    all_folders.append(folder)
                    seen_folder_names.add(folder["name"])
            
            all_assignments.extend(result.get("note_assignments", []))
        
        return {
            "suggested_folders": all_folders,
            "note_assignments": all_assignments
        }
    
    def organize_notes(self, notes: list, existing_folders: list) -> Dict:
        prompt_template = self._load_prompt("organize_notes")
        existing_folders_text = json.dumps(existing_folders, indent=2) if existing_folders else "None"
        
        notes_text = json.dumps(notes, indent=2)
        estimated_tokens = self._estimate_tokens(notes_text) + self._estimate_tokens(prompt_template) + self._estimate_tokens(existing_folders_text)
        
        if estimated_tokens > 150000:
            chunks = self._chunk_notes(notes, max_tokens=140000)
            results = []
            
            for chunk in chunks:
                chunk_text = json.dumps(chunk, indent=2)
                user_prompt = prompt_template.format(
                    notes=chunk_text,
                    existing_folders=existing_folders_text
                )
                
                result = self._call_gpt(
                    system_message="You are an expert at organizing notes into logical folders.",
                    user_prompt=user_prompt,
                    use_json=True
                )
                results.append(result)
            
            return self._merge_organization_results(results)
        else:
            user_prompt = prompt_template.format(
                notes=notes_text,
                existing_folders=existing_folders_text
            )
            
            return self._call_gpt(
                system_message="You are an expert at organizing notes into logical folders.",
                user_prompt=user_prompt,
                use_json=True
            )
