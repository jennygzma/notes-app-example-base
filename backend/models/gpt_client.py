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
    
    def organize_notes(self, notes: list, existing_folders: list) -> Dict:
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
