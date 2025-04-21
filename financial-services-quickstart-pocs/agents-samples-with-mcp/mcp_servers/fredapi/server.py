import httpx
import os
from mcp.server.fastmcp import FastMCP

# Base URL for FRED API
FRED_API_BASE = "https://api.stlouisfed.org/fred"

# Initialize the MCP server
mcp = FastMCP("fred")


# Helper function to call the FRED API and return JSON data
async def call_fred(endpoint: str, params: dict) -> dict | None:
    """Helper function to call the FRED API and return JSON data or None on error."""
    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        raise ValueError("FRED_API_KEY not set in environment variables.")

    params_with_key = {"api_key": api_key, "file_type": "json"}
    params_with_key.update(params)
    url = f"{FRED_API_BASE}/{endpoint}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params_with_key, timeout=30.0)
            response.raise_for_status()
            return response.json()
    except Exception:
        return None


@mcp.tool()
async def get_series_observations(
    series_id: str, start_date: str = None, end_date: str = None
) -> str:
    """Retrieve observations (data points) for a FRED economic data series."""
    params = {"series_id": series_id}
    if start_date:
        params["observation_start"] = start_date
    if end_date:
        params["observation_end"] = end_date
    data = await call_fred("series/observations", params)
    if not data or "observations" not in data:
        return f"Unable to fetch observations for series {series_id}."
    observations = data["observations"]
    if not observations:
        return f"No observations found for series {series_id}."
    lines = [f"Observations for series {series_id}:"]
    for obs in observations:
        date = obs.get("date", "Unknown date")
        value = obs.get("value", "")
        value = "N/A" if value == "." or value == "" else value
        lines.append(f"{date}: {value}")
    return "\n".join(lines)


@mcp.tool()
async def search_series(
    query: str, search_type: str = "full_text", limit: int = 10
) -> str:
    """Search FRED for economic data series by keywords."""
    params = {"search_text": query, "search_type": search_type, "limit": limit}
    data = await call_fred("series/search", params)
    if not data or "seriess" not in data:
        return f"Unable to fetch series search results for '{query}'."
    series_list = data.get("seriess", [])
    if not series_list:
        return f"No series found matching '{query}'."
    total_count = data.get("count", len(series_list))
    shown = len(series_list)
    lines = [f"Found {total_count} series (showing {shown}):"]
    for series in series_list:
        sid = series.get("id", "N/A")
        title = series.get("title", "No title")
        lines.append(f"{sid}: {title}")
    return "\n".join(lines)


@mcp.tool()
async def get_category_children(category_id: int) -> str:
    """Get the child categories for a specified FRED category."""
    params = {"category_id": category_id}
    data = await call_fred("category/children", params)
    if not data or "categories" not in data:
        return f"Unable to fetch child categories for category {category_id}."
    categories = data.get("categories", [])
    if not categories:
        return f"No child categories found for category {category_id}."
    lines = [f"Child categories of category {category_id}:"]
    for cat in categories:
        cid = cat.get("id")
        name = cat.get("name", "Unnamed")
        lines.append(f"Category {cid}: {name}")
    return "\n".join(lines)


@mcp.tool()
async def get_category_series(category_id: int) -> str:
    """List all series under a specific FRED category."""
    params = {"category_id": category_id}
    data = await call_fred("category/series", params)
    if not data or "seriess" not in data:
        return f"Unable to fetch series for category {category_id}."
    series_list = data.get("seriess", [])
    if not series_list:
        return f"No series found in category {category_id}."
    total_count = data.get("count", len(series_list))
    shown = len(series_list)
    lines = [f"Found {total_count} series in category {category_id} (showing {shown}):"]
    for series in series_list:
        sid = series.get("id", "N/A")
        title = series.get("title", "No title")
        lines.append(f"{sid}: {title}")
    return "\n".join(lines)


@mcp.tool()
async def get_release_dates(release_id: int) -> str:
    """Get all release dates for a given FRED release ID."""
    params = {"release_id": release_id}
    data = await call_fred("release/dates", params)
    if not data or "release_dates" not in data:
        return f"Unable to fetch release dates for release {release_id}."
    dates = data.get("release_dates", [])
    if not dates:
        return f"No release dates found for release {release_id}."
    lines = [f"Release dates for release {release_id}:"]
    for entry in dates:
        date = entry.get("date") or entry.get("release_date") or "Unknown date"
        lines.append(str(date))
    return "\n".join(lines)


@mcp.tool()
async def get_releases() -> str:
    """List all economic data releases available in FRED."""
    data = await call_fred("releases", {})
    if not data or "releases" not in data:
        return "Unable to fetch releases."
    releases = data.get("releases", [])
    if not releases:
        return "No releases found."
    total_count = data.get("count", len(releases))
    shown = len(releases)
    lines = [f"Found {total_count} releases (showing {shown}):"]
    for rel in releases:
        rid = rel.get("id", "N/A")
        name = rel.get("name", "No name")
        lines.append(f"{rid}: {name}")
    return "\n".join(lines)


if __name__ == "__main__":
    # Run the MCP server (using stdio for communication)
    mcp.run(transport="stdio")
