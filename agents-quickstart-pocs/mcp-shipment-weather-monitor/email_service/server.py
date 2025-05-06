from mcp.server.fastmcp import FastMCP
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import List, Dict
import argparse
import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

mcp = FastMCP("Email")

# Email configuration - these should be set as environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@gmail.com")

def send_email_smtp(to_email: str, subject: str, body: str) -> Dict:
    """Helper function to send emails via SMTP"""
    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
        logger.error("Email configuration is incomplete")
        return {
            "success": False,
            "error": "Email configuration is incomplete. Please set all required environment variables."
        }

    try:
        logger.info(f"Preparing to send email to: {to_email}")
        logger.debug(f"Subject: {subject}")
        
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        logger.debug(f"Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        
        logger.debug("Attempting SMTP login")
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        logger.debug("Sending email")
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Successfully sent email to: {to_email}")
        return {
            "success": True,
            "to": to_email,
            "subject": subject
        }
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed: {str(e)}")
        return {
            "success": False,
            "error": "Failed to authenticate with SMTP server"
        }
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error occurred: {str(e)}")
        return {
            "success": False,
            "error": f"SMTP error: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error while sending email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def send_delay_notification(tracking_number: str, to_email: str, city: str, state_code: str, carrier: str) -> Dict:
    """
    Send a delay notification email for a specific shipment.
    
    Args:
        tracking_number: The shipment tracking number
        to_email: Recipient's email address
        city: Delivery city
        state_code: Two-letter state code
        carrier: Shipping carrier name
    """
    logger.info(f"Preparing delay notification for shipment {tracking_number} to {city}, {state_code}")
    
    subject = f"Delay Notice - Your {carrier} Shipment {tracking_number}"
    
    body = f"""Dear Valued Customer,

We hope this email finds you well. We are writing to inform you about a delay affecting your {carrier} shipment (Tracking #: {tracking_number}) to {city}, {state_code}.

Current Status: Delayed

This delay is due to weather conditions, as there is currently a frost advisory in the {state_code} area. We are actively monitoring the situation and working to minimize any disruption to your delivery.

You can track your package at any time using your tracking number: {tracking_number}

If you have any questions or concerns, please don't hesitate to contact our customer service team.

We apologize for any inconvenience this may cause and appreciate your understanding.

Best regards,
Your Shipping Team"""

    return send_email_smtp(to_email, subject, body)

@mcp.tool()
def send_bulk_delay_notifications(shipments: List[Dict]) -> Dict:
    """
    Send delay notification emails to multiple recipients.
    
    Args:
        shipments: List of shipment dictionaries containing tracking_number, email, city, state_code, and carrier
    """
    logger.info(f"Starting bulk delay notifications for {len(shipments)} shipments")
    results = []
    
    for shipment in shipments:
        logger.debug(f"Processing shipment: {shipment['tracking_number']}")
        result = send_delay_notification(
            tracking_number=shipment["tracking_number"],
            to_email=shipment["email"],
            city=shipment["city"],
            state_code=shipment["state_code"],
            carrier=shipment["carrier"]
        )
        results.append({
            "tracking_number": shipment["tracking_number"],
            "email": shipment["email"],
            "success": result["success"],
            "error": result.get("error", None)
        })
    
    success_count = sum(1 for r in results if r["success"])
    failure_count = len(results) - success_count
    logger.info(f"Bulk notification complete. Successes: {success_count}, Failures: {failure_count}")
    
    return {
        "success": all(r["success"] for r in results),
        "results": results,
        "summary": {
            "total": len(results),
            "successful": success_count,
            "failed": failure_count
        }
    }

if __name__ == "__main__":
    logger.info("Starting Email Service...")
    parser = argparse.ArgumentParser(description='Email notification service')
    parser.add_argument('--port', type=int, default=5004, help='Port to run the service on')
    args = parser.parse_args()
    
    logger.info(f"Starting email service on port {args.port}")
    mcp.run(transport='stdio') 