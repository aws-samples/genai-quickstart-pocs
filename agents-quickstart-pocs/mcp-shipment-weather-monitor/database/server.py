from mcp.server.fastmcp import FastMCP
import sqlite3
import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

DB_PATH = "shipments.db"

mcp = FastMCP("Shipment")

def fetch_shipments(where_clause="", params=()):
    logger.debug(f"Fetching shipments with where clause: {where_clause}")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        query = f"""
            SELECT tracking_number, status, carrier, city, state_code, email, last_updated
            FROM shipments
            {where_clause}
        """
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        # Format results as list of dicts
        results = [
            {
                "tracking_number": row[0],
                "status": row[1],
                "carrier": row[2],
                "city": row[3],
                "state_code": row[4],
                "email": row[5],
                "last_updated": row[6],
            }
            for row in rows
        ]
        logger.info(f"Retrieved {len(results)} shipments")
        return results
    except sqlite3.Error as e:
        logger.error(f"Database error: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in fetch_shipments: {str(e)}")
        return []

@mcp.tool()
def get_all_shipments():
    """
    Get all shipments in the database.
    """
    logger.info("Fetching all shipments")
    return fetch_shipments()

@mcp.tool()
def get_shipments_by_state(state_code: str):
    """
    Get all shipments for a specific two-letter state code (e.g., 'NY').
    """
    if not state_code or len(state_code) != 2:
        logger.warning(f"Invalid state code provided: {state_code}")
        return {"error": "Please provide a valid two-letter state code (e.g., 'NY')."}
    
    logger.info(f"Fetching shipments for state: {state_code}")
    return fetch_shipments("WHERE state_code = ?", (state_code.upper(),))

@mcp.tool()
def get_shipment_by_tracking_number(tracking_number: str):
    """
    Get a shipment by its tracking number.
    """
    if not tracking_number:
        logger.warning("No tracking number provided")
        return {"error": "Please provide a tracking number."}
    
    logger.info(f"Looking up shipment with tracking number: {tracking_number}")
    results = fetch_shipments("WHERE tracking_number = ?", (tracking_number,))
    if results:
        logger.debug(f"Found shipment: {results[0]}")
        return results[0]  # Return the single shipment as a dict
    else:
        logger.warning(f"No shipment found with tracking number: {tracking_number}")
        return {"error": f"No shipment found with tracking number '{tracking_number}'."}

@mcp.tool()
def update_status_by_state(state_code: str, new_status: str):
    """
    Update the status of all shipments for a given two-letter state code.
    """
    if not state_code or len(state_code) != 2:
        logger.warning(f"Invalid state code provided: {state_code}")
        return {"error": "Please provide a valid two-letter state code (e.g., 'NY')."}
    if not new_status:
        logger.warning("No new status provided")
        return {"error": "Please provide a new status."}
    
    try:
        logger.info(f"Updating status to '{new_status}' for all shipments in {state_code}")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE shipments SET status = ? WHERE state_code = ?",
            (new_status, state_code.upper())
        )
        conn.commit()
        updated = cursor.rowcount
        conn.close()
        
        if updated == 0:
            logger.warning(f"No shipments found with state code: {state_code}")
            return {"error": f"No shipments found with state code '{state_code.upper()}'."}
        
        logger.info(f"Successfully updated {updated} shipments")
        return {
            "success": True,
            "state_code": state_code.upper(),
            "new_status": new_status,
            "updated_count": updated
        }
    except sqlite3.Error as e:
        logger.error(f"Database error while updating status: {str(e)}")
        return {"error": f"Database error: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error while updating status: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}

if __name__ == "__main__":
    logger.info("Starting Database Service...")
    # Initialize and run the server
    mcp.run(transport='stdio')
