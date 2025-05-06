"""
Weather Service Module for Shipment Weather Monitoring System

This module provides a FastMCP server that interfaces with the National Weather Service (NWS) API
to retrieve weather alerts and forecasts. It's used to monitor weather conditions that might
affect shipment deliveries.

The service provides tools to:
1. Get active weather alerts for a specific US state
2. Get detailed weather forecasts for specific geographic coordinates
"""
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
import logging
import sys
from datetime import datetime
import uvicorn

# Configure logging to provide informative output during service operation
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastMCP server with the service name "Weather"
mcp = FastMCP("Weather")

# API configuration constants
NWS_API_BASE = "https://api.weather.gov"  # Base URL for the National Weather Service API
USER_AGENT = "weather-app/1.0"  # User agent required by NWS API

async def make_nws_request(url: str) -> dict[str, Any] | None:
    """
    Make a request to the NWS API with proper error handling.
    
    This helper function handles the HTTP request to the National Weather Service API,
    including proper headers, error handling, and response processing.
    
    Args:
        url: The complete URL for the NWS API endpoint
        
    Returns:
        dict: JSON response data if successful, None if the request failed
    """
    # Set required headers for NWS API
    headers = {
        "User-Agent": USER_AGENT,  # NWS API requires a User-Agent header
        "Accept": "application/geo+json"  # Request GeoJSON format
    }
    
    # Use httpx for async HTTP requests
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Making request to NWS API: {url}")
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()  # Raise exception for 4XX/5XX responses
            logger.debug(f"Successful response from NWS API: {url}")
            return response.json()
        except httpx.TimeoutError:
            # Handle timeout errors specifically
            logger.error(f"Timeout while requesting {url}")
            return None
        except httpx.HTTPError as e:
            # Handle HTTP errors (status codes, connection issues)
            logger.error(f"HTTP error while requesting {url}: {str(e)}")
            return None
        except Exception as e:
            # Catch-all for any other unexpected errors
            logger.error(f"Unexpected error while requesting {url}: {str(e)}")
            return None

def format_alert(feature: dict) -> str:
    """
    Format an alert feature into a readable string.
    
    Extracts and formats the key information from a weather alert feature
    into a human-readable text format.
    
    Args:
        feature: A GeoJSON feature object containing alert properties
        
    Returns:
        str: Formatted alert text with event details, area, severity, and instructions
    """
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

@mcp.tool()
async def get_alerts(state: str) -> str:
    """
    Get weather alerts for a US state.
    
    Retrieves active weather alerts from the National Weather Service API
    for the specified US state and formats them for display.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
        
    Returns:
        str: Formatted string containing all active alerts for the state,
             or an appropriate message if no alerts are found
    """
    logger.info(f"Fetching weather alerts for state: {state}")
    # Construct the URL for the state alerts endpoint
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    # Handle cases where the request failed or returned invalid data
    if not data or "features" not in data:
        logger.warning(f"No valid alert data received for state: {state}")
        return "Unable to fetch alerts or no alerts found."

    # Handle case where there are no active alerts
    if not data["features"]:
        logger.info(f"No active alerts found for state: {state}")
        return "No active alerts for this state."

    # Process and format all alerts
    alert_count = len(data["features"])
    logger.info(f"Found {alert_count} active alerts for state: {state}")
    alerts = [format_alert(feature) for feature in data["features"]]
    
    # Join all formatted alerts with a separator
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """
    Get weather forecast for a location.
    
    Retrieves a detailed weather forecast from the National Weather Service API
    for the specified geographic coordinates.
    
    The NWS API requires a two-step process:
    1. Get the forecast grid endpoint for the coordinates
    2. Use that endpoint to get the actual forecast
    
    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
        
    Returns:
        str: Formatted string containing the weather forecast for the next 5 periods,
             or an error message if the forecast couldn't be retrieved
    """
    logger.info(f"Fetching forecast for location: {latitude}, {longitude}")
    
    # Step 1: Get the forecast grid endpoint for the coordinates
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    # Handle failure to get points data
    if not points_data:
        logger.error(f"Failed to fetch points data for location: {latitude}, {longitude}")
        return "Unable to fetch forecast data for this location."

    # Step 2: Get the forecast using the URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    logger.debug(f"Retrieved forecast URL: {forecast_url}")
    forecast_data = await make_nws_request(forecast_url)

    # Handle failure to get forecast data
    if not forecast_data:
        logger.error(f"Failed to fetch forecast data from {forecast_url}")
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    logger.info(f"Retrieved forecast with {len(periods)} time periods")
    forecasts = []
    
    # Process only the next 5 time periods to keep the output manageable
    for period in periods[:5]:
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    # Join all formatted forecast periods with a separator
    return "\n---\n".join(forecasts)

if __name__ == "__main__":
    # Initialize and run the server when script is executed directly
    logger.info("Starting Weather Service...")
    # Run the FastMCP server using stdio transport for communication
    mcp.run(transport='stdio')