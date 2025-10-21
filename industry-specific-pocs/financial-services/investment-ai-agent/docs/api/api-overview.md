# API Overview

## Introduction

The Investment AI Agent API provides a comprehensive RESTful interface for generating investment ideas, managing proprietary data, and accessing AI-powered financial analysis. The API is built on AWS API Gateway with Cognito authentication and supports both synchronous and asynchronous operations.

## Base URL

```
Production: https://api.investment-ai-agent.com/v1
Staging: https://staging-api.investment-ai-agent.com/v1
Development: https://dev-api.investment-ai-agent.com/v1
```

## Authentication

The API uses AWS Cognito for authentication with JWT tokens. All protected endpoints require a valid Bearer token in the Authorization header.

### Authentication Flow

1. **User Registration**: Admin-only registration through Cognito User Pool
2. **User Login**: Authenticate with email/password to receive JWT tokens
3. **Token Usage**: Include access token in API requests
4. **Token Refresh**: Use refresh token to obtain new access tokens

### Example Authentication

```bash
# Login to get tokens
curl -X POST https://api.investment-ai-agent.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Use token in API requests
curl -X GET https://api.investment-ai-agent.com/v1/ideas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## API Versioning

The API uses URL-based versioning with the version number in the path:
- Current version: `v1`
- Version format: `/v{major}`
- Backward compatibility maintained within major versions

## Request/Response Format

### Request Format

- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Maximum Request Size**: 10MB for file uploads, 1MB for JSON payloads

### Response Format

All API responses follow a consistent JSON structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "investmentHorizon",
      "reason": "Must be one of: short, medium, long"
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1"
  }
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage and system stability:

- **Default Limit**: 1000 requests per hour per user
- **Burst Limit**: 100 requests per minute
- **Premium Limit**: 5000 requests per hour for premium users

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

## API Endpoints Overview

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User authentication |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | User logout |
| GET | `/auth/profile` | Get user profile |

### Investment Ideas Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ideas/generate` | Generate new investment ideas |
| GET | `/ideas` | List user's investment ideas |
| GET | `/ideas/{id}` | Get specific investment idea |
| PUT | `/ideas/{id}` | Update investment idea |
| DELETE | `/ideas/{id}` | Delete investment idea |

### Proprietary Data Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/proprietary-data/upload` | Upload proprietary data files |
| GET | `/proprietary-data` | List uploaded data sources |
| GET | `/proprietary-data/{id}` | Get data source details |
| DELETE | `/proprietary-data/{id}` | Delete data source |

### Web Search Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/web-search/search` | Perform web search |
| POST | `/web-search/deep-research` | Conduct deep research |
| GET | `/web-search/history` | Get search history |

### Market Data Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/market-data/quotes` | Get real-time quotes |
| GET | `/market-data/historical` | Get historical data |
| GET | `/market-data/indicators` | Get technical indicators |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analysis/financial` | Perform financial analysis |
| POST | `/analysis/risk` | Conduct risk assessment |
| POST | `/analysis/compliance` | Check compliance |

### Feedback Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Submit feedback |
| GET | `/feedback` | Get user feedback history |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| GET | `/version` | API version information |
| GET | `/status` | System status |

## Common Request Parameters

### Pagination

Most list endpoints support pagination:

```json
{
  "page": 1,
  "limit": 20,
  "sort": "createdAt",
  "order": "desc"
}
```

### Filtering

List endpoints support filtering:

```json
{
  "filters": {
    "status": "active",
    "createdAfter": "2024-01-01T00:00:00Z",
    "tags": ["technology", "growth"]
  }
}
```

### Field Selection

Specify which fields to include in responses:

```json
{
  "fields": ["id", "title", "description", "createdAt"]
}
```

## Response Metadata

All responses include metadata for debugging and monitoring:

```json
{
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "version": "v1",
    "processingTime": 1250,
    "region": "us-east-1",
    "cached": false
  }
}
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `PROCESSING_ERROR` | Error during request processing |
| `EXTERNAL_SERVICE_ERROR` | External service unavailable |
| `QUOTA_EXCEEDED` | Usage quota exceeded |

## Webhooks

The API supports webhooks for asynchronous notifications:

### Webhook Events

- `idea.generated` - New investment idea generated
- `analysis.completed` - Analysis processing completed
- `data.uploaded` - Proprietary data upload completed
- `compliance.alert` - Compliance issue detected

### Webhook Payload

```json
{
  "event": "idea.generated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "ideaId": "idea_123456789",
    "userId": "user_987654321",
    "status": "completed"
  },
  "signature": "sha256=..."
}
```

## SDK and Libraries

Official SDKs are available for:

- **JavaScript/TypeScript**: `@investment-ai/sdk-js`
- **Python**: `investment-ai-sdk`
- **Java**: `com.investment-ai:sdk-java`
- **C#**: `InvestmentAI.SDK`

### JavaScript SDK Example

```javascript
import { InvestmentAIClient } from '@investment-ai/sdk-js';

const client = new InvestmentAIClient({
  apiKey: 'your-api-key',
  region: 'us-east-1'
});

const ideas = await client.ideas.generate({
  investmentHorizon: 'long',
  riskTolerance: 'moderate',
  sectors: ['technology', 'healthcare']
});
```

## Testing

### Test Environment

A dedicated testing environment is available:
- **Base URL**: `https://test-api.investment-ai-agent.com/v1`
- **Test Data**: Pre-populated with sample data
- **Rate Limits**: Relaxed for testing purposes

### API Testing Tools

- **Postman Collection**: Available for download
- **OpenAPI Specification**: Available at `/openapi.json`
- **Interactive Documentation**: Available at `/docs`

## Support and Resources

### Documentation
- **API Reference**: Detailed endpoint documentation
- **Tutorials**: Step-by-step integration guides
- **Examples**: Code samples and use cases

### Support Channels
- **Email**: api-support@investment-ai-agent.com
- **Documentation**: https://docs.investment-ai-agent.com
- **Status Page**: https://status.investment-ai-agent.com

### Community
- **GitHub**: https://github.com/investment-ai-agent
- **Stack Overflow**: Tag `investment-ai-agent`
- **Discord**: Community chat and support

This API overview provides the foundation for integrating with the Investment AI Agent system. For detailed endpoint documentation, refer to the specific endpoint reference guides.