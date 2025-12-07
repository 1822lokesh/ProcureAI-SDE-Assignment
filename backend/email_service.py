from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

# Configure the connection using settings from .env
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_rfp_email(to_emails: List[EmailStr], rfp_title: str, rfp_id: str):
    """
    Sends an email to vendors with the RFP details.
    """
    # In a real app, we would include a unique link: http://myapp.com/upload/{rfp_id}
    # For now, we just tell them the ID.
    
    html_body = f"""
    <h1>New RFP Invitation: {rfp_title}</h1>
    <p>Hello Vendor,</p>
    <p>You have been invited to bid on a new project.</p>
    <p><b>RFP ID:</b> {rfp_id}</p>
    <p>Please reply with your proposal attached as a PDF.</p>
    <p>Best regards,<br>ProcureAI Team</p>
    """

    message = MessageSchema(
        subject=f"RFP Invitation: {rfp_title}",
        recipients=to_emails,
        body=html_body,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "Emails sent successfully"}
