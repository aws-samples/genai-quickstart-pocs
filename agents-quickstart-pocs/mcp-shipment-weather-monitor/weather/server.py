from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
import logging
import sys
from datetime import datetime
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastMCP server
mcp = FastMCP("Weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"

async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Making request to NWS API: {url}")
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            logger.debug(f"Successful response from NWS API: {url}")
            return response.json()
        except httpx.TimeoutError:
            logger.error(f"Timeout while requesting {url}")
            return None
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while requesting {url}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while requesting {url}: {str(e)}")
            return None

def format_alert(feature: dict) -> str:
    """Format an alert feature into a readable string."""
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
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    logger.info(f"Fetching weather alerts for state: {state}")
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        logger.warning(f"No valid alert data received for state: {state}")
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        logger.info(f"No active alerts found for state: {state}")
        return "No active alerts for this state."

    alert_count = len(data["features"])
    logger.info(f"Found {alert_count} active alerts for state: {state}")
    alerts = [format_alert(feature) for feature in data["features"]]
    
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    logger.info(f"Fetching forecast for location: {latitude}, {longitude}")
    
    # First get the forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        logger.error(f"Failed to fetch points data for location: {latitude}, {longitude}")
        return "Unable to fetch forecast data for this location."

    # Get the forecast URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    logger.debug(f"Retrieved forecast URL: {forecast_url}")
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        logger.error(f"Failed to fetch forecast data from {forecast_url}")
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    logger.info(f"Retrieved forecast with {len(periods)} time periods")
    forecasts = []
    for period in periods[:5]:  # Only show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)

if __name__ == "__main__":
    # Initialize and run the server
    logger.info("Starting Weather Service...")
    mcp.run(transport='stdio')
