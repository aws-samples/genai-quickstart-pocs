# MCP Shipment Weather Monitor

A Model Context Protocol (MCP) based system that monitors weather conditions to proactively identify and notify customers about potential shipping delays. This microservices architecture combines weather data from the National Weather Service with shipment tracking to ensure timely communication about weather-related delivery impacts.

## 🌟 Features

- **Real-time Weather Monitoring**: Integrates with the National Weather Service API to track weather conditions
- **Shipment Tracking**: Maintains a database of active shipments and their delivery locations
- **Automated Notifications**: Sends proactive email alerts to customers about potential weather-related delays
- **MCP Architecture**: Built using Model Context Protocol for efficient service communication

## 🏗️ Architecture

The system consists of three main microservices:

### 1. Weather Service
- Monitors weather conditions and alerts via the National Weather Service API
- Provides endpoints for:
  - Getting active weather alerts by state
  - Retrieving detailed weather forecasts by location

### 2. Database Service
- Manages shipment tracking information
- Provides endpoints for:
  - Retrieving all shipments
  - Filtering shipments by state
  - Looking up shipments by tracking number
  - Updating shipment statuses

### 3. Email Service
- Handles customer communications
- Features:
  - Individual delay notifications
  - Bulk notification capabilities
  - Customizable email templates

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- SQLite3
- SMTP server access for email notifications

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-shipment-weather-monitor.git
cd mcp-shipment-weather-monitor
```

2. Set up virtual environments for each service:
```bash
# Weather Service
cd weather
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Database Service
cd ../database
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Email Service
cd ../email_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Configure environment variables for the email service:
```bash
export SMTP_SERVER="your.smtp.server"
export SMTP_PORT="587"
export SMTP_USERNAME="your_username"
export SMTP_PASSWORD="your_password"
export SENDER_EMAIL="your@email.com"
```

### Running the Services

Start each service in a separate terminal:

```bash
# Weather Service
cd weather
source .venv/bin/activate
python server.py

# Database Service
cd database
source .venv/bin/activate
python server.py

# Email Service
cd email_service
source .venv/bin/activate
python server.py
```

## 📝 Usage Example

The system automatically:
1. Monitors weather conditions in delivery areas
2. Identifies shipments that might be affected
3. Sends notifications to customers about potential delays

Example notification workflow:
```python
# Get weather alerts for a state
alerts = await weather_service.get_alerts("NY")

# If severe weather is detected, find affected shipments
if alerts:
    shipments = database_service.get_shipments_by_state("NY")
    
    # Send notifications to affected customers
    email_service.send_bulk_delay_notifications(shipments)
```

## 🔒 Security

- Environment variables are used for sensitive configurations
- SMTP credentials are never stored in code
- TLS encryption for email communications
- Secure API endpoints with proper error handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- National Weather Service for their comprehensive weather API
- Model Context Protocol (MCP) for enabling efficient service communication
