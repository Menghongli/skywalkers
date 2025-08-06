import os
import secrets
import emails
from datetime import datetime, timedelta
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
    def generate_verification_token(self) -> str:
        return secrets.token_urlsafe(32)
    
    def send_verification_email(self, to_email: str, name: str, verification_token: str) -> bool:
        if not self.smtp_user or not self.smtp_password:
            print("Email credentials not configured")
            return False
            
        verification_url = f"{self.frontend_url}/verify-email?token={verification_token}"
        
        html_content = f"""
        <html>
            <body>
                <h2>Welcome to Skywalkers Basketball Tracker!</h2>
                <p>Hi {name},</p>
                <p>Thank you for registering with Skywalkers Basketball Tracker. Please verify your email address by clicking the link below:</p>
                <p><a href="{verification_url}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-decoration: none; display: inline-block;">Verify Email</a></p>
                <p>Or copy and paste this link in your browser: {verification_url}</p>
                <p>This verification link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
                <p>Best regards,<br>Skywalkers Team</p>
            </body>
        </html>
        """
        
        text_content = f"""
        Welcome to Skywalkers Basketball Tracker!
        
        Hi {name},
        
        Thank you for registering with Skywalkers Basketball Tracker. Please verify your email address by visiting this link:
        
        {verification_url}
        
        This verification link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        Skywalkers Team
        """
        
        try:
            message = emails.html(
                html=html_content,
                text=text_content,
                subject="Verify Your Email - Skywalkers Basketball Tracker",
                mail_from=self.from_email
            )
            
            response = message.send(
                to=to_email,
                smtp={
                    "host": self.smtp_host,
                    "port": self.smtp_port,
                    "tls": True,
                    "user": self.smtp_user,
                    "password": self.smtp_password
                }
            )
            
            return response.status_code == 250
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def is_token_expired(self, sent_at: datetime) -> bool:
        if not sent_at:
            return True
        return datetime.utcnow() - sent_at > timedelta(hours=24)

email_service = EmailService()