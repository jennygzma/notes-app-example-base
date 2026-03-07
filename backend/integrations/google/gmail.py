import requests
import base64
from email.mime.text import MIMEText
from typing import Dict


class GmailService:
    @staticmethod
    def send_email(access_token: str, to: str, subject: str, body: str) -> Dict:
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "raw": raw_message
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return {
            "message_id": result.get("id"),
            "status": "sent"
        }