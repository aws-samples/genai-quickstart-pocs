# Security Guide - Authentication, Authorization & Compliance

## 🛡️ Security Features Implemented

The Advisor Assistant POC implements the following security features for demonstration purposes:

- **Network Isolation**: VPC with private subnets for application containers
- **Authentication**: AWS Cognito User Pools with JWT tokens
- **Access Control**: IAM roles and policies with least privilege principles
- **Data Encryption**: DynamoDB and S3 encryption at rest using AWS managed keys
- **API Protection**: Rate limiting and input validation
- **Audit Logging**: CloudWatch logs for monitoring

### ⚠️ POC Security Limitations
- **HTTP Only**: This POC uses HTTP endpoints. HTTPS with SSL/TLS certificates would be required for production
- **Basic Configuration**: Security settings are configured for POC demonstration, not production hardening
- **No Compliance Certification**: This POC has not undergone security audits or compliance certification

## 🔐 Authentication & Authorization

### AWS Cognito Integration

#### Current Status
✅ **Cognito User Pool**: Deployed and configured  
✅ **Application Integration**: Complete with multi-user support  
✅ **Authentication**: Session-based with JWT tokens  
✅ **User Configuration**: Personalized settings and watchlists  
✅ **Multi-User Support**: Individual user data isolation  

#### Cognito Resources Deployed
- **User Pool**: `advisor-assistant-poc-users`
- **User Pool Client**: Configured for OAuth flows
- **User Pool Domain**: `advisor-assistant-poc-auth`

### Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User        │───▶│ Cognito     │───▶│ JWT Token   │
│ Credentials │    │ User Pool   │    │ Validation  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ User        │    │ API         │
                   │ Attributes  │    │ Access      │
                   └─────────────┘    └─────────────┘
```

### Implementation Details

#### Completed Integration Features

1. **Authentication Service** (`src/services/cognitoAuth.js`)
   - User login/logout with Cognito
   - JWT token verification
   - Admin user management
   - OAuth URL generation

2. **User Configuration Service** (`src/services/userConfig.js`)
   - Personal watchlists per user
   - Individual alert preferences
   - Custom dashboard layouts
   - User-specific analysis settings

3. **Session Management**
   - DynamoDB-backed sessions
   - Secure cookie handling
   - Automatic session refresh

4. **Protected Routes**
   - All API endpoints require authentication
   - User-specific data isolation
   - Admin-only functionality

### Multi-User Features
- **Personal Watchlists**: Each user maintains their own list of tracked companies
- **Custom Alerts**: Alerts filtered by user's watchlist and preferences
- **Individual Settings**: Theme, timezone, risk tolerance, investment horizon
- **Data Isolation**: Users only see their own data and configurations

## 🔧 User Management

### Creating Test Users

Get the User Pool ID:
```bash
aws cloudformation describe-stacks \
  --stack-name advisor-assistant-poc-security \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
  --output text
```

Create a test user:
```bash
USER_POOL_ID="your-user-pool-id"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username testuser \
  --password NewPass123! \
  --permanent
```

### User Experience Flow

1. **First Visit**: Users see a login prompt on the main page
2. **Login**: Users can login via the custom form or OAuth
3. **Onboarding**: New users get default configuration automatically
4. **Personalization**: Users can customize their watchlist and preferences
5. **Data Isolation**: Each user only sees their own companies and alerts

## 🔒 Network Security

### VPC Architecture
```
Internet Gateway
       │
       ▼
┌─────────────┐    ┌─────────────┐
│ Public      │    │ Private     │
│ Subnet      │    │ Subnet      │
│             │    │             │
│ • ALB       │───▶│ • ECS Tasks │
│ • NAT GW    │    │ • App Logic │
└─────────────┘    └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐    ┌─────────────┐
│ Security    │    │ Security    │
│ Group       │    │ Group       │
│             │    │             │
│ • Port 80   │    │ • Port 3000 │
│ • Port 443  │    │ • From ALB  │
└─────────────┘    └─────────────┘
```

### Network Security Features
- **VPC Isolation**: Private subnets for application containers
- **Security Groups**: Restrictive inbound/outbound rules
- **NAT Gateway**: Controlled outbound internet access
- **No Direct Access**: Application containers not directly accessible from internet

## 🔐 Data Security

### Encryption Strategy
- **Encryption at Rest**: All DynamoDB tables encrypted with KMS
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Key Management**: Customer-managed KMS keys
- **Secrets Management**: AWS Secrets Manager for API keys

### Data Protection Features
- **Database Encryption**: DynamoDB tables with KMS encryption
- **S3 Encryption**: Server-side encryption for document storage
- **Secrets Rotation**: Automatic rotation capabilities
- **Access Logging**: All data access logged to CloudWatch

## 🛡️ Application Security

### Input Validation & Sanitization
- **Comprehensive Validation**: All API endpoints validate input
- **SQL Injection Prevention**: Parameterized queries (DynamoDB)
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Session-based CSRF tokens

### Rate Limiting
```javascript
// Environment-specific rate limits
const rateLimits = {
  poc: { auth: 10, api: 1000, ai: 50 },
  dev: { auth: 50, api: 5000, ai: 100 },
  prod: { auth: 5, api: 100, ai: 10 }
};
```

### Security Headers
- **CORS Protection**: Properly configured cross-origin policies
- **Content Security Policy**: Prevents XSS attacks
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection

## 🔍 API Security

### Authentication Requirements
- All endpoints except `/api/health` require authentication
- JWT token validation on every request
- Session-based authentication with secure cookies
- Automatic token refresh for long sessions

### API Endpoints Security

#### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/urls` - Get OAuth URLs

#### User Configuration Endpoints
- `GET /api/user/config` - Get user configuration
- `PUT /api/user/config` - Update user configuration
- `GET /api/user/watchlist` - Get user's watchlist
- `POST /api/user/watchlist` - Add to watchlist
- `DELETE /api/user/watchlist/:ticker` - Remove from watchlist
- `GET /api/user/alerts` - Get user's personalized alerts

#### Admin Endpoints (requires admin role)
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users` - List all users

> 📖 **For detailed admin setup and user management procedures, see [ADMIN-SETUP.md](ADMIN-SETUP.md)**

## ⚙️ Configuration Security

### User Preferences Security
```json
{
  "alertPreferences": {
    "email": true,
    "push": false,
    "earningsAlerts": true,
    "priceAlerts": true,
    "analysisAlerts": true
  },
  "displayPreferences": {
    "theme": "light",
    "currency": "USD",
    "dateFormat": "MM/DD/YYYY",
    "timezone": "America/New_York"
  },
  "analysisSettings": {
    "riskTolerance": "moderate",
    "investmentHorizon": "medium",
    "sectors": [],
    "excludedSectors": []
  }
}
```

### Cognito Configuration Details
- **User Pool**: Email-based authentication
- **Password Policy**: 8+ characters, uppercase, lowercase, numbers
- **MFA**: Disabled (for POC simplicity)
- **OAuth Flows**: Authorization code flow enabled
- **Scopes**: email, openid, profile

## 🔐 Access Control

### IAM Roles & Policies
- **Least Privilege**: Each service has minimal required permissions
- **Role-Based Access**: Separate roles for different functions
- **Resource-Based Policies**: Fine-grained access control
- **Cross-Service Access**: Secure service-to-service communication

### User Data Isolation
- **Personal Watchlists**: Each user maintains separate data
- **Custom Alerts**: Alerts filtered by user preferences
- **Individual Settings**: User-specific configurations
- **Data Segregation**: Users cannot access other users' data

## 📊 Security Monitoring

### Audit Logging
- **CloudTrail**: All API calls logged
- **Application Logs**: User actions and security events
- **Authentication Events**: Login/logout tracking
- **Data Access Logs**: Database and S3 access logging

### Security Metrics
- **Failed Login Attempts**: Monitor for brute force attacks
- **API Rate Limiting**: Track rate limit violations
- **Unusual Access Patterns**: Detect anomalous behavior
- **Error Rates**: Monitor for potential attacks

### Alerting Strategy
- **Security Events**: Unauthorized access attempts
- **Authentication Failures**: Multiple failed logins
- **Rate Limit Violations**: Potential DoS attacks
- **Configuration Changes**: Infrastructure modifications

## 🚀 Production Security Considerations

### Enhanced Security for Production

1. **HTTPS Enforcement**: SSL/TLS certificates for all communications
2. **ALB Authentication**: Consider ALB-level Cognito integration
3. **MFA**: Enable multi-factor authentication
4. **Advanced Monitoring**: Set up CloudWatch alerts for security events
5. **Backup Security**: Regular backup of user configurations
6. **Rate Limiting**: Enhanced API rate limiting per user

### Compliance Features
- **Data Governance**: Data classification and lifecycle management
- **Audit Trails**: Comprehensive logging for compliance
- **Access Reviews**: Regular access permission reviews
- **Encryption Standards**: Industry-standard encryption practices

## 🔧 Security Troubleshooting

### Common Security Issues

1. **"Authentication required" errors**: Check Cognito configuration in .env
2. **Session not persisting**: Verify DynamoDB sessions table exists
3. **User not found**: Ensure user is created in correct User Pool
4. **Token expired**: Implement token refresh logic for long sessions
5. **CORS errors**: Verify CORS configuration for frontend domain

### Debug Commands

```bash
# Check Cognito configuration
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID

# List users
aws cognito-idp list-users --user-pool-id YOUR_POOL_ID

# Check DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Verify security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
```

## 📋 Security Checklist

### Pre-Deployment Security
- [ ] All secrets stored in AWS Secrets Manager
- [ ] No hardcoded credentials in code
- [ ] Security groups configured with minimal access
- [ ] Encryption enabled for all data stores
- [ ] Rate limiting configured appropriately

### Runtime Security
- [ ] Authentication working correctly
- [ ] User data isolation verified
- [ ] API endpoints protected
- [ ] Security headers configured
- [ ] Audit logging enabled

### Monitoring Security
- [ ] CloudTrail enabled
- [ ] Security alerts configured
- [ ] Failed authentication monitoring
- [ ] Unusual access pattern detection
- [ ] Regular security reviews scheduled

---

**This security implementation provides foundational security features suitable for POC demonstrations and customer evaluations. Additional hardening would be required for production use.**