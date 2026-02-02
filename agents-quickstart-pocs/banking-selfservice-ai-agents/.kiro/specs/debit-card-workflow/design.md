# Design Document: Debit Card Workflow

## Overview

The debit card workflow system provides a serverless backend for managing debit card operations (lock, unlock, request new card) through a mock API infrastructure. The system integrates with an MCP (Model Context Protocol) server to enable AI agent interactions via Amazon Connect.

The architecture follows AWS best practices using API Gateway for request routing, Lambda for business logic execution, and DynamoDB for data persistence. This design supports the first sprint of the Jeanie conversational AI banking agent, providing the foundational card management capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   MCP Server    │ (Tool calling interface for AI agent)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  API Gateway    │ (REST API endpoints)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lambda Function │ (Business logic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   DynamoDB      │ (Mock data storage)
└─────────────────┘
```

### Component Responsibilities

**MCP Server**
- Exposes three tools: `lock_card`, `unlock_card`, `request_new_card`
- Translates AI agent requests into API calls
- Formats API responses for agent consumption
- Validates tool parameters before API invocation

**API Gateway**
- Provides REST endpoints for card operations
- Handles request validation and routing
- Manages authentication context propagation
- Returns standardized responses

**Lambda Functions**
- Processes card operation business logic
- Interacts with DynamoDB for data operations
- Implements error handling and validation
- Generates operation responses

**DynamoDB**
- Stores customer, account, and card data
- Provides fast, scalable data access
- Maintains relationships between entities
- Supports query patterns for the application

## Components and Interfaces

### MCP Server Tools

#### Tool: lock_card

**Purpose:** Lock a debit card to prevent transactions

**Input Schema:**
```json
{
  "customer_id": "string (required)",
  "card_id": "string (required)"
}
```

**Output Schema:**
```json
{
  "success": "boolean",
  "message": "string",
  "card": {
    "card_id": "string",
    "status": "locked",
    "last_four": "string",
    "account_id": "string"
  }
}
```

**Error Cases:**
- Authentication failure
- Card not found
- Card not owned by customer
- Service unavailable

#### Tool: unlock_card

**Purpose:** Unlock a debit card to restore transaction capability

**Input Schema:**
```json
{
  "customer_id": "string (required)",
  "card_id": "string (required)"
}
```

**Output Schema:**
```json
{
  "success": "boolean",
  "message": "string",
  "card": {
    "card_id": "string",
    "status": "active",
    "last_four": "string",
    "account_id": "string"
  }
}
```

**Error Cases:**
- Authentication failure
- Card not found
- Card not owned by customer
- Service unavailable

#### Tool: request_new_card

**Purpose:** Request a replacement debit card

**Input Schema:**
```json
{
  "customer_id": "string (required)",
  "account_id": "string (required)",
  "reason": "string (optional)",
  "delivery_address": "string (optional)"
}
```

**Output Schema:**
```json
{
  "success": "boolean",
  "message": "string",
  "request": {
    "request_id": "string",
    "account_id": "string",
    "estimated_delivery": "string (ISO 8601 date)",
    "status": "pending"
  }
}
```

**Error Cases:**
- Authentication failure
- Account not found
- Account not owned by customer
- Service unavailable

### API Gateway Endpoints

**Base URL:** `https://api.example.com/v1`

#### POST /cards/lock

**Request:**
```json
{
  "customer_id": "string",
  "card_id": "string"
}
```

**Response:** Same as lock_card tool output

#### POST /cards/unlock

**Request:**
```json
{
  "customer_id": "string",
  "card_id": "string"
}
```

**Response:** Same as unlock_card tool output

#### POST /cards/request-new

**Request:**
```json
{
  "customer_id": "string",
  "account_id": "string",
  "reason": "string (optional)",
  "delivery_address": "string (optional)"
}
```

**Response:** Same as request_new_card tool output

### Lambda Function Interface

**Function Name:** `CardOperationsHandler`

**Input Event:**
```json
{
  "operation": "lock | unlock | request_new",
  "customer_id": "string",
  "card_id": "string (for lock/unlock)",
  "account_id": "string (for request_new)",
  "reason": "string (optional, for request_new)",
  "delivery_address": "string (optional, for request_new)"
}
```

**Output:**
```json
{
  "statusCode": 200 | 400 | 404 | 500,
  "body": {
    "success": "boolean",
    "message": "string",
    "data": "object (operation-specific)"
  }
}
```

## Data Models

### DynamoDB Table Schemas

#### Customers Table

**Table Name:** `bank-customers`

**Primary Key:** `customer_id` (String)

**Attributes:**
```json
{
  "customer_id": "string (PK)",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Access Patterns:**
- Get customer by customer_id

#### Accounts Table

**Table Name:** `bank-accounts`

**Primary Key:** `account_id` (String)

**Global Secondary Index:** `customer_id-index` on `customer_id`

**Attributes:**
```json
{
  "account_id": "string (PK)",
  "customer_id": "string (GSI)",
  "account_type": "checking | savings",
  "routing_number": "string (9 digits)",
  "account_number": "string",
  "balance": "number",
  "status": "active | closed",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Access Patterns:**
- Get account by account_id
- Get all accounts for a customer (via GSI)

#### Cards Table

**Table Name:** `bank-cards`

**Primary Key:** `card_id` (String)

**Global Secondary Index:** `account_id-index` on `account_id`

**Attributes:**
```json
{
  "card_id": "string (PK)",
  "account_id": "string (GSI)",
  "card_number": "string (masked, last 4 visible)",
  "last_four": "string (4 digits)",
  "card_type": "debit",
  "status": "active | locked | expired | cancelled",
  "expiration_date": "string (MM/YY)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Access Patterns:**
- Get card by card_id
- Get all cards for an account (via GSI)

#### Card Replacement Requests Table

**Table Name:** `bank-card-requests`

**Primary Key:** `request_id` (String)

**Global Secondary Index:** `customer_id-index` on `customer_id`

**Attributes:**
```json
{
  "request_id": "string (PK)",
  "customer_id": "string (GSI)",
  "account_id": "string",
  "reason": "string",
  "delivery_address": "string",
  "estimated_delivery": "string (ISO 8601 date)",
  "status": "pending | processing | shipped | delivered",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Access Patterns:**
- Get request by request_id
- Get all requests for a customer (via GSI)

### Data Relationships

```
Customer (1) ──── (N) Accounts
                      │
                      │ (1)
                      │
                      ▼
                     (N) Cards
```

- One customer can have multiple accounts
- One account can have multiple cards
- Card replacement requests link to customer and account

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Core Operation Properties

**Property 1: Card ownership authorization**

*For any* card operation (lock, unlock) and any customer ID and card ID, the operation should only succeed if the card belongs to an account owned by that customer.

**Validates: Requirements 3.1, 4.1**

**Property 2: Lock operation state transition**

*For any* valid card owned by an authenticated customer, successfully locking the card should result in the card status being "locked" in the data store.

**Validates: Requirements 3.2**

**Property 3: Unlock operation state transition**

*For any* valid locked card owned by an authenticated customer, successfully unlocking the card should result in the card status being "active" in the data store.

**Validates: Requirements 4.2**

**Property 4: Operation idempotence**

*For any* card, performing the same operation twice (lock-lock or unlock-unlock) should produce the same result as performing it once, without errors.

**Validates: Requirements 3.4, 4.4**

**Property 5: Card not found error handling**

*For any* non-existent card ID, attempting any card operation should return a "card not found" error response.

**Validates: Requirements 3.5, 4.5**

**Property 6: Account ownership authorization for card requests**

*For any* card replacement request, the operation should only succeed if the specified account is owned by the authenticated customer.

**Validates: Requirements 5.1**

**Property 7: Card request persistence**

*For any* successful card replacement request, a corresponding request record should be created in the data store with a unique request ID and estimated delivery date.

**Validates: Requirements 5.2, 5.3**

**Property 8: Optional parameter handling**

*For any* card replacement request, the operation should succeed whether or not optional parameters (reason, delivery_address) are provided.

**Validates: Requirements 5.5, 5.6**

### Authentication Properties

**Property 9: Authentication validation**

*For any* card operation request, the system should validate the customer ID against the data store before processing the operation.

**Validates: Requirements 1.1, 1.4**

**Property 10: Authentication success behavior**

*For any* valid customer ID, successful authentication should result in the customer's account information being retrieved from the data store.

**Validates: Requirements 1.2**

**Property 11: Authentication failure handling**

*For any* invalid customer ID, the system should reject the request and return an authentication error without exposing security details.

**Validates: Requirements 1.3, 10.2**

### Data Integrity Properties

**Property 12: Customer ID uniqueness**

*For any* two customer records in the data store, they should have different customer IDs.

**Validates: Requirements 2.1**

**Property 13: Account-customer referential integrity**

*For any* account record in the data store, the associated customer ID should reference an existing customer record.

**Validates: Requirements 2.2**

**Property 14: Routing number uniqueness**

*For any* two account records in the data store, they should have different routing numbers.

**Validates: Requirements 2.3, 12.2**

**Property 15: Routing number format**

*For any* account record, the routing number should be exactly 9 digits.

**Validates: Requirements 12.4**

**Property 16: Account type support**

*For any* account with type "checking" or "savings", all card operations (lock, unlock, request new) should function correctly regardless of account type.

**Validates: Requirements 2.4, 11.1, 11.2, 11.4**

**Property 17: Card-account referential integrity**

*For any* card record in the data store, the associated account ID should reference an existing account record.

**Validates: Requirements 2.6**

**Property 18: Customer-accounts relationship**

*For any* customer with multiple accounts, querying accounts by customer ID should return all accounts associated with that customer.

**Validates: Requirements 2.5**

**Property 19: Account-cards relationship**

*For any* account with multiple cards, querying cards by account ID should return all cards associated with that account.

**Validates: Requirements 8.7**

### Response Format Properties

**Property 20: Successful operation response structure**

*For any* successful card operation (lock, unlock, request new), the response should include a success flag, message, and operation-specific data matching the defined schema.

**Validates: Requirements 3.3, 4.3, 5.4**

**Property 21: Account type in responses**

*For any* account information retrieval, the response should include the account type field with value "checking" or "savings".

**Validates: Requirements 11.3, 11.5**

**Property 22: Routing number in responses**

*For any* account information retrieval, the response should include the routing number field.

**Validates: Requirements 12.1, 12.3**

### Error Handling Properties

**Property 23: Descriptive error messages**

*For any* failed card operation, the error response should include a descriptive message explaining the failure reason.

**Validates: Requirements 10.1**

**Property 24: Validation error details**

*For any* request with invalid parameters, the system should return a validation error response with details about which parameters are invalid.

**Validates: Requirements 10.5**

**Property 25: Database error handling**

*For any* database operation failure, the system should return a "service unavailable" error without exposing internal error details.

**Validates: Requirements 10.4**

### API and Integration Properties

**Property 26: Request format validation**

*For any* malformed request to the API Gateway, the system should reject the request with a validation error before invoking Lambda.

**Validates: Requirements 6.2**

**Property 27: Authentication context propagation**

*For any* valid API request, the authentication context should be passed from API Gateway to the Lambda function.

**Validates: Requirements 6.4**

**Property 28: Lambda error response handling**

*For any* Lambda execution failure, the API Gateway should return an appropriate error response to the caller.

**Validates: Requirements 6.6**

**Property 29: Lambda parameter validation**

*For any* Lambda invocation with invalid parameters, the function should reject the request with a validation error before database operations.

**Validates: Requirements 7.2**

**Property 30: Lambda response formatting**

*For any* completed database operation, the Lambda function should format the response according to the defined schema for that operation type.

**Validates: Requirements 7.4**

**Property 31: Operation logging**

*For any* card operation (successful or failed), the system should generate log entries for debugging and audit purposes.

**Validates: Requirements 7.6, 10.6**

### MCP Server Properties

**Property 32: MCP tool to API endpoint mapping**

*For any* MCP tool invocation (lock_card, unlock_card, request_new_card), the MCP server should call the corresponding API endpoint with the correct parameters.

**Validates: Requirements 9.2**

**Property 33: MCP response formatting**

*For any* API response received by the MCP server, the response should be formatted into a structure suitable for the AI agent.

**Validates: Requirements 9.3**

**Property 34: MCP parameter validation**

*For any* MCP tool invocation with invalid parameters, the MCP server should reject the request before making an API call.

**Validates: Requirements 9.5**

**Property 35: MCP error handling**

*For any* API call failure, the MCP server should return a structured error response to the AI agent.

**Validates: Requirements 9.6**

### Data Persistence Properties

**Property 36: Write-read consistency**

*For any* data written to the data store, immediately reading that data should return the same values that were written.

**Validates: Requirements 8.5**

## Error Handling

### Error Categories

**Authentication Errors**
- **Code:** `AUTH_FAILED`
- **HTTP Status:** 401
- **Message:** "Authentication failed. Please verify your credentials."
- **Cause:** Invalid customer ID or authentication token

**Authorization Errors**
- **Code:** `UNAUTHORIZED`
- **HTTP Status:** 403
- **Message:** "You are not authorized to perform this operation on the specified resource."
- **Cause:** Customer attempting to access card/account they don't own

**Validation Errors**
- **Code:** `VALIDATION_ERROR`
- **HTTP Status:** 400
- **Message:** "Invalid request parameters: [details]"
- **Cause:** Missing required fields, invalid format, or constraint violations

**Not Found Errors**
- **Code:** `NOT_FOUND`
- **HTTP Status:** 404
- **Message:** "The requested resource was not found."
- **Cause:** Card ID, account ID, or customer ID doesn't exist

**Service Errors**
- **Code:** `SERVICE_UNAVAILABLE`
- **HTTP Status:** 503
- **Message:** "Service temporarily unavailable. Please try again later."
- **Cause:** Database connection failure, timeout, or internal error

### Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context (optional)"
    }
  }
}
```

### Error Handling Strategy

**Lambda Function Level**
- Catch all exceptions and convert to appropriate error responses
- Log errors with full context for debugging
- Never expose internal implementation details in error messages
- Use specific error codes for different failure scenarios

**API Gateway Level**
- Validate request format before Lambda invocation
- Return 400 for malformed requests
- Map Lambda errors to appropriate HTTP status codes
- Add CORS headers to error responses

**MCP Server Level**
- Validate tool parameters before API calls
- Convert API errors to structured responses for AI agent
- Provide actionable error messages for the agent to communicate to users
- Log all errors for monitoring

**DynamoDB Level**
- Handle conditional check failures (e.g., duplicate IDs)
- Retry transient errors with exponential backoff
- Convert DynamoDB errors to service unavailable errors
- Log database errors for investigation

### Retry Strategy

**Transient Errors** (network issues, throttling)
- Retry up to 3 times with exponential backoff
- Initial delay: 100ms, max delay: 1000ms

**Non-Transient Errors** (validation, not found, authorization)
- Do not retry
- Return error immediately

## Testing Strategy

### Dual Testing Approach

This system will use both unit testing and property-based testing to ensure comprehensive correctness validation:

**Unit Tests** verify specific examples, edge cases, and error conditions:
- Specific customer/card/account scenarios
- Boundary conditions (empty strings, null values)
- Error cases (missing cards, unauthorized access)
- Integration points between components

**Property-Based Tests** verify universal properties across all inputs:
- Generate random valid and invalid inputs
- Test properties hold for all generated cases
- Discover edge cases through randomization
- Validate correctness properties from this design

Both approaches are complementary and necessary for production-quality software.

### Property-Based Testing Configuration

**Framework:** We will use a property-based testing library appropriate for the implementation language:
- Python: `hypothesis`
- TypeScript/JavaScript: `fast-check`
- Java: `jqwik` or `QuickCheck`

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: debit-card-workflow, Property {N}: {property_text}`
- Each correctness property implemented as a single property-based test

**Test Organization:**
- Property tests co-located with implementation code
- Test file naming: `{module}.property.test.{ext}`
- Unit tests in separate files: `{module}.test.{ext}`

### Test Coverage Areas

**Lambda Function Tests**
- Unit tests for each operation handler (lock, unlock, request new)
- Property tests for validation logic
- Property tests for error handling
- Property tests for response formatting
- Mock DynamoDB for isolated testing

**DynamoDB Integration Tests**
- Property tests for data integrity constraints
- Property tests for referential integrity
- Property tests for uniqueness constraints
- Property tests for query patterns
- Use local DynamoDB for testing

**API Gateway Tests**
- Unit tests for request validation
- Property tests for parameter validation
- Property tests for error response formatting
- Mock Lambda for isolated testing

**MCP Server Tests**
- Unit tests for each tool (lock_card, unlock_card, request_new_card)
- Property tests for parameter validation
- Property tests for API call mapping
- Property tests for response transformation
- Mock API Gateway for isolated testing

**End-to-End Tests**
- Integration tests for complete workflows
- Test all three operations through MCP server to database
- Verify error handling across all layers
- Test with realistic data scenarios

### Test Data Strategy

**Generators for Property Tests:**
- Customer ID generator (valid format)
- Card ID generator (valid format)
- Account ID generator (valid format)
- Account type generator (checking/savings)
- Routing number generator (9 digits)
- Invalid input generators (malformed IDs, missing fields)

**Mock Data for Unit Tests:**
- Predefined customer records
- Predefined account records (checking and savings)
- Predefined card records (active, locked)
- Predefined error scenarios

**Test Database:**
- Use DynamoDB Local for integration tests
- Seed with consistent test data
- Clean up after each test run
- Isolated test environment per test suite
