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
        """Estimate tokens: roughly 1 token per 4 characters"""
        return len(text) // 4
    
    def _chunk_notes(self, notes: list, max_tokens: int = 20000) -> list:
        """Split notes into chunks that fit in context window"""
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for note in notes:
            note_text = json.dumps({"id": note["id"], "title": note["title"], "body": note["body"]})
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
    
    def _merge_organization_results(self, results: list) -> Dict:
        """Merge multiple organization results, deduping folders and combining assignments"""
        merged_folders = {}
        all_assignments = []
        
        for result in results:
            for folder in result.get("suggested_folders", []):
                folder_name = folder["name"]
                if folder_name not in merged_folders:
                    merged_folders[folder_name] = folder
            
            all_assignments.extend(result.get("assignments", []))
        
        return {
            "suggested_folders": list(merged_folders.values()),
            "assignments": all_assignments
        }
    
    def organize_notes(self, notes: list, existing_folders: list) -> Dict:
        """
        Organize notes into folders with intelligent chunking.
        
        If notes exceed ~20K tokens per batch, chunk and process separately,
        then merge results intelligently.
        
        Returns: {suggested_folders, assignments}
        """
        if not notes:
            return {"suggested_folders": [], "assignments": []}
        
        total_tokens = sum(self._estimate_tokens(json.dumps({"id": n["id"], "title": n["title"], "body": n["body"]})) for n in notes)
        
        if total_tokens > 20000:
            chunks = self._chunk_notes(notes, max_tokens=20000)
            results = []
            
            for chunk in chunks:
                result = self._organize_notes_batch(chunk, existing_folders)
                results.append(result)
                existing_folders = existing_folders + result.get("suggested_folders", [])
            
            return self._merge_organization_results(results)
        else:
            return self._organize_notes_batch(notes, existing_folders)
    
    def _organize_notes_batch(self, notes: list, existing_folders: list) -> Dict:
        """Organize a single batch of notes"""
        prompt_template = self._load_prompt("organize_notes")
        
        notes_text = json.dumps([{"id": n["id"], "title": n["title"], "body": n["body"]} for n in notes], indent=2)
        folders_text = ', '.join([f["name"] for f in existing_folders]) if existing_folders else 'None'
        
        user_prompt = prompt_template.format(
            existing_folders=folders_text,
            notes=notes_text
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that organizes notes into folders.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def chat_step1_select_folders(self, question: str, folders: list, 
                                  conversation_history: list) -> Dict:
        """
        Step 1: Analyze question and select relevant folders.
        Returns: {reasoning, selected_folder_ids}
        """
        prompt_template = self._load_prompt("chat_step1_select_folders")
        
        folders_text = json.dumps([{"id": f["id"], "name": f["name"]} for f in folders], indent=2)
        
        history_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:
                history_text += f"{msg['role']}: {msg['content']}\n"
        else:
            history_text = "No previous conversation"
        
        user_prompt = prompt_template.format(
            question=question,
            folders=folders_text,
            conversation_history=history_text
        )
        
        return self._call_gpt(
            system_message="You are a helpful assistant that helps find relevant information in a note collection.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def chat_step2_answer(self, question: str, notes: list,
                         conversation_history: list) -> Dict:
        """
        Step 2: Answer question using notes from selected folders.
        Returns: {reasoning, answer, referenced_note_ids}
        """
        prompt_template = self._load_prompt("chat_step2_answer")
        
        notes_text = json.dumps([{"id": n["id"], "title": n["title"], "body": n["body"]} for n in notes], indent=2)
        
        history_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:
                history_text += f"{msg['role']}: {msg['content']}\n"
        else:
            history_text = "No previous conversation"
        
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
