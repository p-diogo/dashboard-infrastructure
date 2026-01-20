"""
Email sending functionality with SMTP
"""
import os
import smtplib
import secrets
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
from typing import Optional


def generate_otp_code(length: int = 6) -> str:
    """
    Generate a random numeric OTP code

    Args:
        length: Number of digits (default 6)

    Returns:
        Numeric OTP code as string
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


class EmailSender:
    """Handles sending OTP emails via SMTP"""

    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.smtp_from = os.getenv('SMTP_FROM', 'The Graph Dashboards <noreply@thegraph.org>')
        self.use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        self.template_path = Path('/app/templates/email.html')

        # Validate required settings
        if not self.smtp_user or not self.smtp_password:
            raise ValueError("SMTP_USER and SMTP_PASSWORD must be set")

    def _load_template(self) -> str:
        """Load email template from file"""
        if not self.template_path.exists():
            # Fallback basic template
            return """<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h1>Your REO Dashboard Access Code</h1>
  <p>Use this verification code to sign in:</p>
  <div style="font-size: 36px; font-weight: bold; padding: 20px; background: #f0f0f0; text-align: center;">
    {{ CODE }}
  </div>
  <p>This code expires in <strong>10 minutes</strong></p>
  <p>If you didn't request this code, you can safely ignore this email.</p>
</body>
</html>"""

        with open(self.template_path, 'r') as f:
            return f.read()

    def _render_template(self, code: str) -> str:
        """Render email template with OTP code"""
        template = self._load_template()
        return template.replace('{{ CODE }}', code)

    def send_otp_email(self, email: str, code: str) -> bool:
        """
        Send OTP code to email address

        Args:
            email: Recipient email address
            code: OTP code to send

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('related')
            msg['From'] = self.smtp_from
            msg['To'] = email
            msg['Subject'] = 'Your REO Dashboard Access Code'

            # Render HTML template
            html_content = self._render_template(code)

            # Attach HTML body
            msg.attach(MIMEText(html_content, 'html'))

            # Attach logo if exists
            logo_path = Path('/app/templates/grt_logo.png')
            if logo_path.exists():
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                logo = MIMEImage(logo_data)
                logo.add_header('Content-ID', '<grt_logo.png>')
                msg.attach(logo)

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            return True

        except Exception as e:
            print(f"Failed to send email: {e}")
            return False


# Global email sender instance
_sender: Optional[EmailSender] = None


def get_email_sender() -> EmailSender:
    """Get or create global email sender instance"""
    global _sender
    if _sender is None:
        _sender = EmailSender()
    return _sender
