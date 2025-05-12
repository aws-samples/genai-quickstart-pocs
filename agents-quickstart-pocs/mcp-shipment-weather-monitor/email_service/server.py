"""
Email Service Module for Shipment Weather Monitoring System

This module provides a FastMCP server that handles email notifications for shipment delays,
particularly those caused by weather conditions. It includes functionality for sending
individual and bulk email notifications to customers.

The service requires SMTP configuration through environment variables or a .env file.
"""
from mcp.server.fastmcp import FastMCP
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import List, Dict
import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime

# Try to import dotenv for .env file support
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

# Configure logging to provide informative output during service operation
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize the FastMCP server with the service name "Email"
mcp = FastMCP("Email")

# Load environment variables from .env file if available
if DOTENV_AVAILABLE:
    # Look for .env file in the current directory
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        logger.info(f"Loading configuration from {env_path}")
        load_dotenv(dotenv_path=env_path)
    else:
        logger.warning(f".env file not found at {env_path}. Using environment variables or defaults.")
else:
    logger.warning("python-dotenv package not installed. Using environment variables or defaults.")
    logger.info("To use .env files, install python-dotenv: pip install python-dotenv")

# Email configuration - loaded from .env file or environment variables
# Default values are provided for development but should be overridden in production
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@gmail.com")

def send_email_smtp(to_email: str, subject: str, body: str) -> Dict:
    """
    Helper function to send emails via SMTP
    
    This function handles the actual email sending process using the configured SMTP server.
    It creates a MIME message, establishes a connection to the SMTP server, and sends the email.
    
    Args:
        to_email: Recipient's email address
        subject: Email subject line
        body: Plain text email body content
        
    Returns:
        Dict: Result dictionary with success status and additional information
    """
    # Validate that all required configuration is present
    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
        logger.error("Email configuration is incomplete")
        return {
            "success": False,
            "error": "Email configuration is incomplete. Please set all required environment variables or use a .env file."
        }

    try:
        logger.info(f"Preparing to send email to: {to_email}")
        logger.debug(f"Subject: {subject}")
        
        # Create a multipart message and set headers
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        # Add body to email as plain text
        msg.attach(MIMEText(body, 'plain'))

        # Connect to SMTP server with TLS security
        logger.debug(f"Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        
        # Login to the SMTP server with credentials
        logger.debug("Attempting SMTP login")
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send the email and close the connection
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
        # Handle authentication failures separately for better diagnostics
        logger.error(f"SMTP authentication failed: {str(e)}")
        return {
            "success": False,
            "error": "Failed to authenticate with SMTP server"
        }
    except smtplib.SMTPException as e:
        # Handle other SMTP-specific errors
        logger.error(f"SMTP error occurred: {str(e)}")
        return {
            "success": False,
            "error": f"SMTP error: {str(e)}"
        }
    except Exception as e:
        # Catch-all for any other unexpected errors
        logger.error(f"Unexpected error while sending email: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def send_delay_notification(tracking_number: str, to_email: str, city: str, state_code: str, carrier: str) -> Dict:
    """
    Send a delay notification email for a specific shipment.
    
    This function creates a formatted email notification about a shipment delay
    due to weather conditions and sends it to the customer.
    
    Args:
        tracking_number: The shipment tracking number
        to_email: Recipient's email address
        city: Delivery city
        state_code: Two-letter state code
        carrier: Shipping carrier name
        
    Returns:
        Dict: Result of the email sending operation
    """
    logger.info(f"Preparing delay notification for shipment {tracking_number} to {city}, {state_code}")
    
    # Create a descriptive subject line
    subject = f"Delay Notice - Your {carrier} Shipment {tracking_number}"
    
    # Format a detailed and professional email body
    body = f"""Dear Valued Customer,

We hope this email finds you well. We are writing to inform you about a delay affecting your {carrier} shipment (Tracking #: {tracking_number}) to {city}, {state_code}.

Current Status: Delayed

This delay is due to weather conditions, as there is currently a frost advisory in the {state_code} area. We are actively monitoring the situation and working to minimize any disruption to your delivery.

You can track your package at any time using your tracking number: {tracking_number}

If you have any questions or concerns, please don't hesitate to contact our customer service team.

We apologize for any inconvenience this may cause and appreciate your understanding.

Best regards,
Your Shipping Team"""

    # Send the email using the helper function
    return send_email_smtp(to_email, subject, body)

@mcp.tool()
def send_bulk_delay_notifications(shipments: List[Dict]) -> Dict:
    """
    Send delay notification emails to multiple recipients.
    
    This function processes a list of shipments and sends delay notifications
    to each recipient, then aggregates the results.
    
    Args:
        shipments: List of shipment dictionaries containing tracking_number, email, city, state_code, and carrier
        
    Returns:
        Dict: Aggregated results of all email sending operations with summary statistics
    """
    logger.info(f"Starting bulk delay notifications for {len(shipments)} shipments")
    results = []
    
    # Process each shipment and send individual notifications
    for shipment in shipments:
        logger.debug(f"Processing shipment: {shipment['tracking_number']}")
        result = send_delay_notification(
            tracking_number=shipment["tracking_number"],
            to_email=shipment["email"],
            city=shipment["city"],
            state_code=shipment["state_code"],
            carrier=shipment["carrier"]
        )
        # Track the result for each shipment
        results.append({
            "tracking_number": shipment["tracking_number"],
            "email": shipment["email"],
            "success": result["success"],
            "error": result.get("error", None)
        })
    
    # Calculate summary statistics
    success_count = sum(1 for r in results if r["success"])
    failure_count = len(results) - success_count
    logger.info(f"Bulk notification complete. Successes: {success_count}, Failures: {failure_count}")
    
    # Return comprehensive results with summary
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
    # Parse command line arguments for configuration
    parser = argparse.ArgumentParser(description='Email notification service')
    parser.add_argument('--port', type=int, default=5004, help='Port to run the service on')
    args = parser.parse_args()
    
    logger.info(f"Starting email service on port {args.port}")
    # Run the FastMCP server using stdio transport for communication
    mcp.run(transport='stdio')