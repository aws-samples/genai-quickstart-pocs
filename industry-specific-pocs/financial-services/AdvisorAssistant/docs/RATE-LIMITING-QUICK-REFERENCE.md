# Rate Limiting Quick Reference

## 🚦 **Current Settings by Environment**

| Environment | Auth Limit | API Limit | AI Limit | Use Case |
|-------------|------------|-----------|----------|----------|
| **POC/Demo** | 10/15min | 1000/15min | 50/hour | Demonstrations, testing |
| **Production** | 5/15min | 100/15min | 10/hour | Live customer usage |
| **Enterprise** | 3/15min | 50/15min | 5/hour | High-security deployments |

## ⚡ **Quick Commands**

### **Deploy with Production Rate Limits**
```bash
# Automatic production limits
./deploy-with-tests.sh production us-east-1 YOUR_API_KEY

# Custom limits
RATE_LIMIT_AUTH_MAX=3 RATE_LIMIT_API_MAX=50 RATE_LIMIT_AI_MAX=5 \
./deploy-with-tests.sh production us-east-1 YOUR_API_KEY
```

### **Update Existing Deployment**
```bash
# Update CloudFormation stack with new limits
aws cloudformation update-stack \
  --stack-name advisor-assistant-production-app \
  --use-previous-template \
  --parameters \
    ParameterKey=RateLimitAuthMax,ParameterValue=3 \
    ParameterKey=RateLimitApiMax,ParameterValue=50 \
    ParameterKey=RateLimitAiMax,ParameterValue=5
```

### **Monitor Rate Limiting**
```bash
# Check rate limit events in logs
aws logs filter-log-events \
  --log-group-name /ecs/advisor-assistant-production \
  --filter-pattern "rate limit" \
  --start-time $(date -d '1 hour ago' +%s)000
```

## 🔧 **Environment Variables**

| Variable | Default | Production | Description |
|----------|---------|------------|-------------|
| `RATE_LIMIT_AUTH_MAX` | 10 | 5 | Auth attempts per window |
| `RATE_LIMIT_AUTH_WINDOW_MS` | 900000 | 900000 | Auth window (15 min) |
| `RATE_LIMIT_API_MAX` | 1000 | 100 | API requests per window |
| `RATE_LIMIT_API_WINDOW_MS` | 900000 | 900000 | API window (15 min) |
| `RATE_LIMIT_AI_MAX` | 50 | 10 | AI requests per hour |
| `RATE_LIMIT_AI_WINDOW_MS` | 3600000 | 3600000 | AI window (1 hour) |
| `RATE_LIMIT_WHITELIST` | - | - | Comma-separated IPs to whitelist |

## 🎯 **Recommendations by Scale**

### **Small Scale (< 100 users)**
- Keep POC settings
- Monitor usage patterns

### **Medium Scale (100-1000 users)**
- Auth: 5/15min
- API: 200/15min  
- AI: 20/hour

### **Large Scale (1000+ users)**
- Auth: 3/15min
- API: 100/15min
- AI: 10/hour
- Consider user-based limits

## 🚨 **Emergency Rate Limit Adjustment**

If under attack or experiencing abuse:

```bash
# Immediate strict limits
aws ecs update-service \
  --cluster advisor-assistant-production-cluster \
  --service advisor-assistant-production-service \
  --force-new-deployment

# Update environment variables via CloudFormation
aws cloudformation update-stack \
  --stack-name advisor-assistant-production-app \
  --use-previous-template \
  --parameters \
    ParameterKey=RateLimitAuthMax,ParameterValue=1 \
    ParameterKey=RateLimitApiMax,ParameterValue=10 \
    ParameterKey=RateLimitAiMax,ParameterValue=1
```

## 📊 **Rate Limit Headers**

Your API returns these headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 🔍 **Troubleshooting**

### **Users Getting Rate Limited**
1. Check CloudWatch logs for IP patterns
2. Consider IP whitelisting for legitimate users
3. Adjust limits based on usage patterns

### **Rate Limits Too Strict**
1. Monitor application metrics
2. Gradually increase limits
3. Implement user-based rate limiting

### **Rate Limits Too Loose**
1. Check for abuse patterns
2. Implement stricter limits
3. Add additional monitoring

---

**For detailed configuration, see [RATE-LIMITING-GUIDE.md](RATE-LIMITING-GUIDE.md)**