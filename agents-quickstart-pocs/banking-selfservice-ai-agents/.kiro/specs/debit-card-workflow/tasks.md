# Implementation Plan: Debit Card Workflow

## Overview

This implementation plan breaks down the debit card workflow system into discrete coding tasks. The system will be built using Python for AWS Lambda functions, with DynamoDB for data storage, API Gateway for REST endpoints, and an MCP server for AI agent integration. Each task builds incrementally toward a complete, tested system.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create Python project structure with separate modules for Lambda, MCP server, and shared utilities
  - Set up `requirements.txt` with dependencies: `boto3`, `hypothesis` (for property testing), `pytest`, `moto` (for mocking AWS services)
  - Create configuration files for AWS resources (DynamoDB table definitions, API Gateway configuration)
  - Set up testing framework with pytest
  - _Requirements: All_

- [x] 2. Implement DynamoDB data models and table setup
  - [x] 2.1 Create DynamoDB table schemas and initialization scripts
    - Define table schemas for Customers, Accounts, Cards, and CardRequests tables
    - Write Python script to create tables with correct primary keys and GSIs
    - Implement table initialization with mock seed data for testing
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.2, 8.3, 8.4_
  
  - [ ]* 2.2 Write property test for customer ID uniqueness
    - **Property 12: Customer ID uniqueness**
    - **Validates: Requirements 2.1**
  
  - [ ]* 2.3 Write property test for routing number uniqueness and format
    - **Property 14: Routing number uniqueness**
    - **Property 15: Routing number format**
    - **Validates: Requirements 2.3, 12.2, 12.4**
  
  - [ ]* 2.4 Write property test for referential integrity
    - **Property 13: Account-customer referential integrity**
    - **Property 17: Card-account referential integrity**
    - **Validates: Requirements 2.2, 2.6**
  
  - [ ]* 2.5 Write property test for write-read consistency
    - **Property 36: Write-read consistency**
    - **Validates: Requirements 8.5**

- [x] 3. Implement data access layer
  - [x] 3.1 Create database client wrapper for DynamoDB operations
    - Implement CustomerRepository with methods: get_customer, create_customer
    - Implement AccountRepository with methods: get_account, get_accounts_by_customer, create_account
    - Implement CardRepository with methods: get_card, get_cards_by_account, update_card_status, create_card
    - Implement CardRequestRepository with methods: create_request, get_request
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 8.7_
  
  - [ ]* 3.2 Write property tests for repository query patterns
    - **Property 18: Customer-accounts relationship**
    - **Property 19: Account-cards relationship**
    - **Validates: Requirements 2.5, 8.7**
  
  - [ ]* 3.3 Write unit tests for repository error handling
    - Test handling of non-existent records
    - Test handling of DynamoDB errors
    - _Requirements: 10.4_

- [x] 4. Implement authentication service
  - [x] 4.1 Create authentication module
    - Implement `authenticate_customer` function that validates customer ID against database
    - Implement `verify_card_ownership` function that checks if card belongs to customer's account
    - Implement `verify_account_ownership` function that checks if account belongs to customer
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 4.2 Write property tests for authentication
    - **Property 9: Authentication validation**
    - **Property 10: Authentication success behavior**
    - **Property 11: Authentication failure handling**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 10.2**
  
  - [ ]* 4.3 Write property tests for authorization
    - **Property 1: Card ownership authorization**
    - **Property 6: Account ownership authorization for card requests**
    - **Validates: Requirements 3.1, 4.1, 5.1**

- [x] 5. Implement card operations business logic
  - [x] 5.1 Create card operations module with lock card function
    - Implement `lock_card` function with authentication, authorization, and state update
    - Handle idempotent locking (already locked cards)
    - Return structured response with card details
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.2 Create unlock card function
    - Implement `unlock_card` function with authentication, authorization, and state update
    - Handle idempotent unlocking (already unlocked cards)
    - Return structured response with card details
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.3 Create request new card function
    - Implement `request_new_card` function with authentication and authorization
    - Generate unique request ID and estimated delivery date
    - Handle optional parameters (reason, delivery_address)
    - Create request record in database
    - Return structured response with request details
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 5.4 Write property tests for lock operation
    - **Property 2: Lock operation state transition**
    - **Property 4: Operation idempotence** (lock case)
    - **Property 5: Card not found error handling** (lock case)
    - **Validates: Requirements 3.2, 3.4, 3.5**
  
  - [ ]* 5.5 Write property tests for unlock operation
    - **Property 3: Unlock operation state transition**
    - **Property 4: Operation idempotence** (unlock case)
    - **Property 5: Card not found error handling** (unlock case)
    - **Validates: Requirements 4.2, 4.4, 4.5**
  
  - [ ]* 5.6 Write property tests for request new card operation
    - **Property 7: Card request persistence**
    - **Property 8: Optional parameter handling**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6**
  
  - [ ]* 5.7 Write property tests for account type support
    - **Property 16: Account type support**
    - **Validates: Requirements 2.4, 11.1, 11.2, 11.4**

- [ ] 6. Checkpoint - Ensure core business logic tests pass
  - Run all property tests and unit tests for business logic
  - Verify authentication, authorization, and card operations work correctly
  - Ask the user if questions arise

- [x] 7. Implement Lambda function handlers
  - [x] 7.1 Create Lambda handler for card operations
    - Implement main Lambda handler function that routes to lock/unlock/request_new operations
    - Parse and validate input event from API Gateway
    - Call appropriate business logic function
    - Format response according to Lambda proxy integration format
    - Implement comprehensive error handling with appropriate status codes
    - Add CloudWatch logging for all operations
    - _Requirements: 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 7.2 Write property tests for Lambda parameter validation
    - **Property 29: Lambda parameter validation**
    - **Validates: Requirements 7.2**
  
  - [ ]* 7.3 Write property tests for Lambda response formatting
    - **Property 20: Successful operation response structure**
    - **Property 30: Lambda response formatting**
    - **Validates: Requirements 3.3, 4.3, 5.4, 7.4**
  
  - [ ]* 7.4 Write property tests for Lambda error handling
    - **Property 28: Lambda error response handling**
    - **Property 31: Operation logging**
    - **Validates: Requirements 6.6, 7.6, 10.6**
  
  - [ ]* 7.5 Write unit tests for Lambda routing logic
    - Test routing to correct operation based on input
    - Test error handling for unknown operations
    - _Requirements: 7.1_

- [ ] 8. Implement error handling and response formatting
  - [ ] 8.1 Create error handling utilities
    - Implement error classes for different error types (AuthError, ValidationError, NotFoundError, ServiceError)
    - Implement error response formatter that converts exceptions to standardized error responses
    - Ensure error messages are descriptive without exposing sensitive details
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ]* 8.2 Write property tests for error handling
    - **Property 23: Descriptive error messages**
    - **Property 24: Validation error details**
    - **Property 25: Database error handling**
    - **Validates: Requirements 10.1, 10.4, 10.5**
  
  - [ ]* 8.3 Write property tests for response formatting
    - **Property 21: Account type in responses**
    - **Property 22: Routing number in responses**
    - **Validates: Requirements 11.3, 11.5, 12.1, 12.3**

- [ ] 9. Implement MCP server
  - [ ] 9.1 Create MCP server with card operation tools
    - Set up MCP server using Python MCP SDK
    - Implement `lock_card` tool with description and parameter schema
    - Implement `unlock_card` tool with description and parameter schema
    - Implement `request_new_card` tool with description and parameter schema
    - Configure API Gateway endpoint URL for tool invocations
    - _Requirements: 3.6, 4.6, 5.7, 9.1, 9.4_
    
  
  - [ ] 9.2 Implement MCP tool handlers
    - Create handler for `lock_card` tool that calls API Gateway endpoint
    - Create handler for `unlock_card` tool that calls API Gateway endpoint
    - Create handler for `request_new_card` tool that calls API Gateway endpoint
    - Implement parameter validation before API calls
    - Format API responses for AI agent consumption
    - Handle API errors and convert to structured error responses
    - _Requirements: 9.2, 9.3, 9.5, 9.6_
  
  - [ ]* 9.3 Write property tests for MCP server
    - **Property 32: MCP tool to API endpoint mapping**
    - **Property 33: MCP response formatting**
    - **Property 34: MCP parameter validation**
    - **Property 35: MCP error handling**
    - **Validates: Requirements 9.2, 9.3, 9.5, 9.6**
  
  - [ ]* 9.4 Write unit tests for MCP tool descriptions
    - Test that all three tools are exposed
    - Test that tool descriptions are present and helpful
    - _Requirements: 9.1, 9.4_

- [ ] 10. Create API Gateway configuration
  - [ ] 10.1 Define API Gateway REST API
    - Create OpenAPI/Swagger specification for the API
    - Define POST /cards/lock endpoint
    - Define POST /cards/unlock endpoint
    - Define POST /cards/request-new endpoint
    - Configure request validation schemas
    - Configure Lambda proxy integration
    - Configure CORS if needed
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 10.2 Write property tests for API Gateway integration
    - **Property 26: Request format validation**
    - **Property 27: Authentication context propagation**
    - **Validates: Requirements 6.2, 6.4**

- [ ] 11. Create deployment and infrastructure scripts
  - [ ] 11.1 Create AWS CloudFormation or Terraform templates
    - Define DynamoDB tables with correct schemas
    - Define Lambda function with appropriate IAM roles
    - Define API Gateway with endpoints and integrations
    - Configure CloudWatch log groups
    - Set up environment variables for Lambda
    - _Requirements: All infrastructure_
  
  - [ ] 11.2 Create deployment script
    - Write script to package Lambda function code
    - Write script to deploy CloudFormation/Terraform stack
    - Write script to seed DynamoDB with test data
    - Document deployment process in README
    - _Requirements: All infrastructure_

- [ ] 12. Create integration tests
  - [ ]* 12.1 Write end-to-end integration tests
    - Test complete lock card workflow from MCP server to database
    - Test complete unlock card workflow from MCP server to database
    - Test complete request new card workflow from MCP server to database
    - Test error scenarios across all layers
    - Use DynamoDB Local for isolated testing
    - _Requirements: All_

- [ ] 13. Final checkpoint - Complete system validation
  - Run all unit tests, property tests, and integration tests
  - Verify all 36 correctness properties pass
  - Deploy to test environment and perform manual smoke tests
  - Ensure all three card operations work through MCP server
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Python with `hypothesis` library will be used for property-based testing
- All property tests should run minimum 100 iterations
- DynamoDB Local will be used for isolated testing without AWS costs
