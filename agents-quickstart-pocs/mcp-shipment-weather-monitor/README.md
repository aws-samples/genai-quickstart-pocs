# MCP Shipment Weather Monitor

This project demonstrates a microservices architecture using Model Context Protocol (MCP) to monitor shipments and weather conditions that might affect deliveries.

## Features

- **Real-time Weather Impact Analysis**: Automatically correlate shipment destinations with current weather alerts
- **Proactive Customer Communication**: Send timely notifications when weather conditions may delay deliveries
- **Shipment Status Management**: Update shipment statuses based on external conditions
- **Geographic Filtering**: Query and manage shipments by state or specific tracking numbers
- **Bulk Operations**: Process multiple shipments simultaneously for efficient updates
- **Detailed Weather Information**: Access both alerts and forecasts for informed decision-making
- **Secure Configuration**: Store sensitive credentials in .env files rather than hardcoded values

## Services

The system consists of three main services:

1. **Database Service**: Manages shipment data and provides query capabilities
2. **Weather Service**: Interfaces with the National Weather Service API to get weather alerts and forecasts
3. **Email Service**: Sends notifications to customers about shipment delays

## Setup

### Prerequisites

- Python 3.8+
- uv (Python package manager)
- MCP CLI (`pip install mcp[cli]`)
- Amazon Q Developer extension (for testing with Amazon Q)

### Installation

1. Clone this repository
2. Install dependencies for each service:

```bash
cd database
uv pip install -e .

cd ../weather
uv pip install -e .

cd ../email_service
uv pip install -e .
```

### Configuration

#### Email Service Configuration

The email service requires SMTP configuration. Copy the `.env.example` file to `.env` in the `email_service` directory:

```bash
# Copy the example config to .env in the email_service directory
cp email_service/.env.example email_service/.env
```

Then edit the `.env` file with your SMTP credentials:

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@gmail.com
```

> **Important**: The `.env` file must exist for the email service to work properly. The `.env.example` file is provided as a template but will not be read by the application.

### Database Setup

Initialize the shipments database:

```bash
cd database
python create_shipments_db.py
```

## Running the Services

Start all services using the MCP configuration:

```bash
mcp start
```

Or start individual services:

```bash
# Database service
cd database
python server.py

# Weather service
cd weather
python server.py

# Email service
cd email_service
python server.py
```

## Usage

Once all services are running, you can interact with them through an MCP-compatible client or through an AI assistant that supports the Model Context Protocol. The services expose the following tools:

### Database Service Tools
- `get_all_shipments`: Retrieve all shipments in the database
- `get_shipments_by_state`: Get shipments for a specific state
- `get_shipment_by_tracking_number`: Look up a shipment by its tracking number
- `update_status_by_state`: Update the status of all shipments in a state

### Weather Service Tools
- `get_alerts`: Get active weather alerts for a specific state
- `get_forecast`: Get detailed weather forecast for specific coordinates

### Email Service Tools
- `send_delay_notification`: Send a delay notification for a specific shipment
- `send_bulk_delay_notifications`: Send notifications for multiple shipments

## Testing with Amazon Q Developer

Amazon Q Developer provides native support for the Model Context Protocol, making it an excellent tool for testing and interacting with MCP services.

### Setup for Amazon Q Developer

1. **Install the Amazon Q Developer Extension**:
   - For VS Code: Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.amazon-q-vscode)
   - For JetBrains IDEs: Install from the [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/20498-amazon-q)

2. **Configure MCP in Amazon Q**:
   - Open your IDE settings
   - Navigate to the Amazon Q Developer settings
   - Enable the Model Context Protocol feature
   - Verify that Amazon Q can discover your running MCP services

### Example Prompts for Amazon Q

Once your services are running and Amazon Q is configured, you can test the system with prompts like these:

1. **Query Shipment Information**:
   ```
   Can you show me all shipments in the database?
   ```

2. **Check Weather Alerts**:
   ```
   Are there any weather alerts for Texas that might affect shipments?
   ```

3. **Send Notifications for Affected Shipments**:
   ```
   There's a storm warning in New York. Can you find all shipments going to NY and send delay notifications to the customers?
   ```

4. **Update Shipment Status**:
   ```
   Please update the status of all shipments to California to "Delayed" due to weather conditions.
   ```


## Advanced Usage

For more complex scenarios, you can chain operations across multiple services. For example:

1. Query the database for shipments to a specific state
2. Check weather alerts for that state
3. If alerts exist, send notifications to affected customers
4. Update the shipment status in the database

Amazon Q Developer can orchestrate these multi-step workflows when given appropriate instructions.

**Complex Workflow**:
   ```
   Can you check for weather alerts in Texas, and if there are any severe alerts, find all shipments going to Texas and send delay notifications to those customers?
   ```

## Quick Demo
Additionally, here is the quick demo for this application (click the image to view):

![Screen Recording of Demo](mcp_demo.gif)

