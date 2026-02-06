# Local Development

Run and test the card operations API locally without deploying to AWS.

## Prerequisites

- Python 3.11+
- Docker (for DynamoDB Local)
- Git

---

## Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd betterbank
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run DynamoDB Local

### Using Docker

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

### Using Java (Alternative)

```bash
# Download DynamoDB Local
wget https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Run
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

---

## Create Tables

```bash
python scripts/create_tables.py
```

This creates:
- `betterbank-customers`
- `betterbank-accounts`
- `betterbank-cards`
- `betterbank-card-requests`

---

## Seed Test Data

```bash
python scripts/seed_data.py
```

This creates:
- 3 customers (CUST001, CUST002, CUST003)
- 5 accounts (ACC001-ACC005)
- 5 cards (CARD001-CARD005)

---

## Run Tests

### All Tests

```bash
pytest
```

### Unit Tests Only

```bash
pytest -m unit
```

### Integration Tests Only

```bash
pytest -m integration
```

### With Coverage

```bash
pytest --cov=src --cov-report=html
open htmlcov/index.html  # View coverage report
```

---

## Test Locally

### Run Integration Tests

```bash
python scripts/test_local.py
```

This tests all 3 operations:
- Lock card
- Unlock card
- Request new card

### Test MCP Server

```bash
python scripts/test_mcp_server.py
```

---

## Manual Testing

### Using Python

```python
from src.shared.card_operations import CardOperations
from src.shared.repositories import (
    CustomerRepository,
    AccountRepository,
    CardRepository,
    CardRequestRepository
)
from src.shared.config import Config

# Initialize
config = Config()
config.DYNAMODB_ENDPOINT = "http://localhost:8000"

customer_repo = CustomerRepository(config)
account_repo = AccountRepository(config)
card_repo = CardRepository(config)
request_repo = CardRequestRepository(config)

card_ops = CardOperations(
    customer_repo,
    account_repo,
    card_repo,
    request_repo
)

# Lock card
result = card_ops.lock_card("CUST001", "CARD001")
print(result)

# Unlock card
result = card_ops.unlock_card("CUST001", "CARD001")
print(result)

# Request new card
result = card_ops.request_new_card(
    "CUST001",
    "ACC001",
    "Lost card",
    "123 Main St, City, State 12345"
)
print(result)
```

---

## Environment Variables

### Local Development

```bash
export DYNAMODB_ENDPOINT=http://localhost:8000
export CUSTOMERS_TABLE=betterbank-customers
export ACCOUNTS_TABLE=betterbank-accounts
export CARDS_TABLE=betterbank-cards
export CARD_REQUESTS_TABLE=betterbank-card-requests
```

### AWS Deployment

Environment variables are set automatically by CloudFormation.

---

## Project Structure

```
.
├── src/
│   ├── lambda_handler/
│   │   ├── handler.py          # Lambda entry point
│   │   └── __init__.py
│   ├── mcp_server/
│   │   ├── server.py           # MCP server
│   │   ├── lock_card_server.py
│   │   ├── unlock_card_server.py
│   │   ├── request_new_card_server.py
│   │   └── __init__.py
│   └── shared/
│       ├── auth.py             # Authentication
│       ├── card_operations.py  # Business logic
│       ├── config.py           # Configuration
│       ├── exceptions.py       # Custom exceptions
│       ├── repositories.py     # Data access
│       └── __init__.py
├── scripts/
│   ├── create_tables.py        # Create DynamoDB tables
│   ├── seed_data.py            # Seed local data
│   ├── test_local.py           # Integration tests
│   └── test_mcp_server.py      # MCP server tests
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── __init__.py
├── requirements.txt            # Python dependencies
└── pytest.ini                  # Pytest configuration
```

---

## Debugging

### VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Test Local",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/scripts/test_local.py",
      "console": "integratedTerminal",
      "env": {
        "DYNAMODB_ENDPOINT": "http://localhost:8000"
      }
    },
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}
```

### PyCharm

1. Run → Edit Configurations
2. Add new Python configuration
3. Script path: `scripts/test_local.py`
4. Environment variables: `DYNAMODB_ENDPOINT=http://localhost:8000`

---

## Common Issues

### DynamoDB Connection Error

**Error**: `Unable to connect to DynamoDB Local`

**Solution**:
```bash
# Check if DynamoDB Local is running
docker ps | grep dynamodb

# Restart if needed
docker run -p 8000:8000 amazon/dynamodb-local
```

### Import Errors

**Error**: `ModuleNotFoundError: No module named 'src'`

**Solution**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Table Already Exists

**Error**: `ResourceInUseException: Table already exists`

**Solution**:
```bash
# Delete existing tables
python scripts/delete_tables.py

# Recreate
python scripts/create_tables.py
```

---

## Next Steps

- **Deploy to AWS**: See [Backend Deployment](BACKEND_DEPLOYMENT.md)
- **API Reference**: See [API Reference](API_REFERENCE.md)
- **Architecture**: See [Architecture](ARCHITECTURE.md)
