import requests
import base64
from email.mime.text import MIMEText
from typing import Dict
from integrations.google.auth import GoogleAuthService


class GmailService:
    def __init__(self):
        self.auth = GoogleAuthService()
        self.base_url = "https://gmail.googleapis.com/gmail/v1"

    def _headers(self) -> Dict[str, str]:
        token = self.auth.get_valid_access_token()
        if not token:
            raise ValueError("Missing Google access token")
        return {"Authorization": f"Bearer {token}"}

    def send_email(self, to: str, subject: str, body: str) -> Dict:
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        url = f"{self.base_url}/users/me/messages/send"
        payload = {"raw": raw_message}
        
        response = requests.post(url, headers=self._headers(), json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return {
            "message_id": result.get("id"),
            "status": "sent"
        }