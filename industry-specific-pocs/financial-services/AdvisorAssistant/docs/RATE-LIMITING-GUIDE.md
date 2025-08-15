# Rate Limiting Configuration Guide

## 🚦 **Current POC Configuration**

The application currently uses generous rate limits optimized for POC demonstrations and testing:

```javascript
// Authentication rate limiting (POC settings)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

// General API rate limiting (POC settings)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per IP per 15 minutes
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: '15 minutes'
  }
});
```

## 🏭 **Production Rate Limiting Recommendations**

### **Authentication Endpoints**
```javascript
// PRODUCTION - Stricter authentication limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP per 15 minutes
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Remove development skip in production
  skip: () => false
});
```

### **General API Endpoints**
```javascript
// PRODUCTION - Reasonable API limits
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15 minutes
  message: {
    error: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false // No development exceptions
});
```

### **Heavy Operations (AI Analysis)**
```javascript
// PRODUCTION - Strict limits for expensive operations
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 AI analysis requests per hour per IP
  message: {
    error: 'AI analysis rate limit exceeded. Please try again in an hour.',
    retryAfter: '1 hour'
  }
});

// Apply to expensive endpoints
app.post('/api/fetch-earnings/:ticker', cognitoAuth.requireAuth(), validateTicker, aiLimiter, handler);
app.post('/api/rerun-analysis/:ticker', cognitoAuth.requireAuth(), validateTicker, aiLimiter, handler);
```

## 🔧 **Configuration Methods**

### **Method 1: Environment Variables (Recommended)**

Add to your CloudFormation template:
```yaml
# In ECS Task Definition Environment Variables
- Name: RATE_LIMIT_AUTH_MAX
  Value: '5'
- Name: RATE_LIMIT_AUTH_WINDOW_MS
  Value: '900000'  # 15 minutes
- Name: RATE_LIMIT_API_MAX
  Value: '100'
- Name: RATE_LIMIT_API_WINDOW_MS
  Value: '900000'  # 15 minutes
- Name: RATE_LIMIT_AI_MAX
  Value: '10'
- Name: RATE_LIMIT_AI_WINDOW_MS
  Value: '3600000'  # 1 hour
```

Update your application code:
```javascript
// Environment-driven rate limiting
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || (process.env.NODE_ENV === 'production' ? 5 : 10),
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000) / 60000) + ' minutes'
  },
  skip: (req) => {
    // Only skip in development mode
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.includes('localhost'));
  }
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_API_MAX) || (process.env.NODE_ENV === 'production' ? 100 : 1000),
  message: {
    error: 'Rate limit exceeded, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_API_WINDOW_MS) || 15 * 60 * 1000) / 60000) + ' minutes'
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});
```

### **Method 2: Configuration File**

Create `config/rate-limits.json`:
```json
{
  "development": {
    "auth": {
      "windowMs": 900000,
      "max": 10,
      "skipLocalhost": true
    },
    "api": {
      "windowMs": 900000,
      "max": 1000,
      "skipAll": true
    },
    "ai": {
      "windowMs": 3600000,
      "max": 50
    }
  },
  "production": {
    "auth": {
      "windowMs": 900000,
      "max": 5,
      "skipLocalhost": false
    },
    "api": {
      "windowMs": 900000,
      "max": 100,
      "skipAll": false
    },
    "ai": {
      "windowMs": 3600000,
      "max": 10
    }
  },
  "enterprise": {
    "auth": {
      "windowMs": 900000,
      "max": 3,
      "skipLocalhost": false
    },
    "api": {
      "windowMs": 900000,
      "max": 50,
      "skipAll": false
    },
    "ai": {
      "windowMs": 3600000,
      "max": 5
    }
  }
}
```

Load in application:
```javascript
const rateLimitConfig = require('./config/rate-limits.json');
const currentConfig = rateLimitConfig[process.env.NODE_ENV] || rateLimitConfig.development;

const authLimiter = rateLimit({
  windowMs: currentConfig.auth.windowMs,
  max: currentConfig.auth.max,
  // ... rest of config
});
```

## 📊 **Rate Limiting Strategies by Environment**

### **POC/Demo Environment**
- **Purpose**: Allow extensive testing and demonstrations
- **Auth Limit**: 10 attempts per 15 minutes
- **API Limit**: 1000 requests per 15 minutes
- **AI Limit**: 50 requests per hour
- **Skip Rules**: Skip localhost in development

### **Staging Environment**
- **Purpose**: Production-like testing with realistic limits
- **Auth Limit**: 7 attempts per 15 minutes
- **API Limit**: 200 requests per 15 minutes
- **AI Limit**: 20 requests per hour
- **Skip Rules**: No exceptions

### **Production Environment**
- **Purpose**: Protect against abuse while serving legitimate users
- **Auth Limit**: 5 attempts per 15 minutes
- **API Limit**: 100 requests per 15 minutes
- **AI Limit**: 10 requests per hour
- **Skip Rules**: No exceptions

### **Enterprise Environment**
- **Purpose**: Stricter limits for high-security deployments
- **Auth Limit**: 3 attempts per 15 minutes
- **API Limit**: 50 requests per 15 minutes
- **AI Limit**: 5 requests per hour
- **Skip Rules**: No exceptions

## 🔍 **Monitoring Rate Limits**

### **CloudWatch Metrics**
Add custom metrics to track rate limiting:

```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

// Enhanced rate limiter with metrics
const createRateLimiterWithMetrics = (name, options) => {
  return rateLimit({
    ...options,
    onLimitReached: async (req, res, options) => {
      // Log to CloudWatch
      await cloudwatch.putMetricData({
        Namespace: 'AdvisorAssistant/RateLimit',
        MetricData: [{
          MetricName: `${name}LimitReached`,
          Value: 1,
          Unit: 'Count',
          Dimensions: [{
            Name: 'Environment',
            Value: process.env.NODE_ENV || 'development'
          }]
        }]
      }).promise();
      
      console.warn(`Rate limit reached for ${name}:`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
    }
  });
};
```

### **Rate Limit Headers**
The current implementation includes standard rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## 🚀 **Deployment Instructions**

### **For Current POC → Production Migration**

1. **Update Environment Variables in CloudFormation:**
```yaml
# Add to cloudformation/02-application-infrastructure-poc.yaml
- Name: RATE_LIMIT_AUTH_MAX
  Value: !Ref RateLimitAuthMax
- Name: RATE_LIMIT_API_MAX
  Value: !Ref RateLimitApiMax

# Add parameters
Parameters:
  RateLimitAuthMax:
    Type: Number
    Default: 5
    Description: Maximum authentication attempts per window
  RateLimitApiMax:
    Type: Number
    Default: 100
    Description: Maximum API requests per window
```

2. **Deploy with New Limits:**
```bash
# Deploy with production rate limits
./deploy-with-tests.sh production us-east-1 YOUR_API_KEY \
  --parameter-overrides \
  RateLimitAuthMax=5 \
  RateLimitApiMax=100
```

3. **Monitor After Deployment:**
```bash
# Check CloudWatch logs for rate limit events
aws logs filter-log-events \
  --log-group-name /ecs/advisor-assistant-production \
  --filter-pattern "Rate limit" \
  --start-time $(date -d '1 hour ago' +%s)000
```

## ⚠️ **Important Considerations**

### **Load Balancer vs Application Rate Limiting**
- **Current**: Application-level rate limiting (per container)
- **Production**: Consider ALB-level rate limiting for better protection
- **Enterprise**: Add AWS WAF rate limiting for additional protection

### **Distributed Rate Limiting**
For multi-container deployments, consider:
- **Redis-based rate limiting** for shared state
- **DynamoDB-based rate limiting** for AWS-native solution
- **Sticky sessions** to maintain per-IP tracking

### **Whitelist/Blacklist Support**
```javascript
// Add IP whitelist support
const ipWhitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];

const rateLimiter = rateLimit({
  // ... other options
  skip: (req) => {
    return ipWhitelist.includes(req.ip) || 
           (process.env.NODE_ENV === 'development' && req.ip.includes('localhost'));
  }
});
```

## 📈 **Scaling Recommendations**

### **Small Scale (< 1000 users)**
- Current POC settings are appropriate
- Monitor and adjust based on usage patterns

### **Medium Scale (1000-10000 users)**
- Reduce API limits to 100 requests per 15 minutes
- Implement user-based rate limiting (not just IP-based)
- Add Redis for distributed rate limiting

### **Large Scale (> 10000 users)**
- Implement tiered rate limiting based on user subscription
- Use AWS WAF for additional protection
- Consider API Gateway rate limiting
- Implement circuit breakers for external API calls

## 🔧 **Quick Configuration Changes**

To quickly adjust rate limits without code changes:

```bash
# Update ECS service with new environment variables
aws ecs update-service \
  --cluster advisor-assistant-production-cluster \
  --service advisor-assistant-production-service \
  --task-definition $(aws ecs describe-services \
    --cluster advisor-assistant-production-cluster \
    --services advisor-assistant-production-service \
    --query 'services[0].taskDefinition' --output text) \
  --force-new-deployment

# Or update via CloudFormation parameter
aws cloudformation update-stack \
  --stack-name advisor-assistant-production-app \
  --use-previous-template \
  --parameters ParameterKey=RateLimitAuthMax,ParameterValue=3 \
             ParameterKey=RateLimitApiMax,ParameterValue=50
```

---

**Next Steps**: Choose your preferred configuration method and update your deployment scripts accordingly. The environment variable approach is recommended for flexibility and ease of management.