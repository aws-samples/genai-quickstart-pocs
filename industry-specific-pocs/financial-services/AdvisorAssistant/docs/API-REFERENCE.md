# API Reference Guide

## Quick Test

```bash
# Health check (no auth)
curl http://your-alb-dns/api/health

# Login
curl -X POST http://your-alb-dns/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"Demo123!"}'

# Add company
curl -X POST http://your-alb-dns/api/companies \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SESSION_COOKIE" \
  -d '{"ticker":"AAPL","name":"Apple Inc."}'

# Get AI analysis
curl http://your-alb-dns/api/analysis/AAPL \
  -H "Cookie: connect.sid=SESSION_COOKIE"
```

## Authentication

### Login
```bash
POST /api/auth/login
{"username":"demo", "password":"Demo123!"}
```

### Logout
```bash
POST /api/auth/logout
```

### Get current user
```bash
GET /api/auth/me
```

## Companies

### List companies
```bash
GET /api/companies
```

### Add company
```bash
POST /api/companies
{"ticker":"AAPL", "name":"Apple Inc."}
```

### Remove company
```bash
DELETE /api/companies/AAPL
```

## Financial Data

### Get financial data history
```bash
GET /api/financial-data/AAPL
```

### Fetch fresh financial data
```bash
POST /api/fetch-data/AAPL
```

## AI Analysis

### Get analysis
```bash
GET /api/analysis/AAPL
```

**Response:**
```json
{
  "sentiment": "positive",
  "summary": "Apple exceeded expectations...",
  "keyInsights": [{"insight": "Strong EPS beat", "impact": "positive"}],
  "alerts": [{"message": "EPS beat by $0.08"}]
}
```

## Alerts

### Get alerts
```bash
GET /api/alerts
GET /api/alerts?unread=true
```

### Mark as read
```bash
PUT /api/alerts/ALERT_ID/read
```

## User Settings

### Get watchlist
```bash
GET /api/user/watchlist
```

### Add to watchlist
```bash
POST /api/user/watchlist
{"ticker":"AAPL", "companyName":"Apple Inc."}
```

### Remove from watchlist
```bash
DELETE /api/user/watchlist/AAPL
```

### Get user config
```bash
GET /api/user/config
```

## JavaScript Example

```javascript
// Login
const login = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'demo', password: 'Demo123!'})
});

// Add to watchlist
const watchlist = await fetch('/api/user/watchlist', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'include',
  body: JSON.stringify({ticker: 'AAPL', companyName: 'Apple Inc.'})
});

// Get analysis
const analysis = await fetch('/api/analysis/AAPL', {
  credentials: 'include'
}).then(r => r.json());
```

## Python Example

```python
import requests

# Login and maintain session
session = requests.Session()
session.post('http://your-alb/api/auth/login', 
  json={'username': 'demo', 'password': 'Demo123!'})

# Add company
session.post('http://your-alb/api/companies',
  json={'ticker': 'AAPL', 'name': 'Apple Inc.'})

# Get analysis
analysis = session.get('http://your-alb/api/analysis/AAPL').json()
print(analysis['summary'])
```

## Error Codes

- **401** - Not logged in
- **403** - No permission
- **404** - Not found
- **400** - Invalid data
- **500** - Server error

## Notes

- All endpoints except `/api/health` require authentication
- Use session cookies after login
- Rate limit: 100 requests/minute
- AI analysis takes 2-5 seconds