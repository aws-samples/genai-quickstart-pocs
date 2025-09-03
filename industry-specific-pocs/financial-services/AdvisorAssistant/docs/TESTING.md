# Testing Guide

## 🧪 Pre-Deployment Test Suite

A comprehensive test suite that validates code quality, syntax, dependencies, and deployment readiness before each deployment.

### Related Documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures that use these tests
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solutions for test failures
- **[WINDOWS-SETUP.md](WINDOWS-SETUP.md)** - Windows-specific testing considerations

### Quick Start

```bash
# Run all pre-deployment tests
npm run test:pre-deploy

# Or run directly
./scripts/pre-deploy-tests.sh

# Deploy with automatic testing
npm run deploy:safe
# Or
```

## 📋 Test Categories

### 1. **Syntax and Structure Validation**
- ✅ JavaScript syntax validation for all service files
- ✅ JSON validity (package.json, config files)
- ✅ Essential file existence checks
- ✅ CloudFormation template presence

### 2. **Dependency and Import Validation**
- ✅ Node.js service import verification
- ✅ NPM dependency integrity check
- ✅ Module resolution validation

### 3. **Configuration Validation**
- ✅ Environment file existence (.env, .env.example)
- ✅ Docker configuration syntax
- ✅ Script permissions and executability

### 4. **NPM Script Validation**
- ✅ All package.json scripts execute successfully
- ✅ Build and lint processes work correctly

### 5. **Application Health Check**
- ✅ Deployed application accessibility
- ✅ Health endpoint response validation
- ✅ API response format verification

### 6. **Security and Best Practices**
- ✅ No hardcoded AWS keys in source code
- ✅ Environment variable usage verification
- ⚠️ Console.log statement detection (informational)

### 7. **Deployment Readiness**
- ✅ AWS CLI availability and configuration
- ✅ Docker installation and daemon status
- ✅ CloudFormation template syntax (basic)

## 🚀 Usage Examples

### Manual Testing
```bash
# Run pre-deployment tests only
npm run test:pre-deploy

# Check specific test results
./scripts/pre-deploy-tests.sh | grep "❌"  # Show only failures
```

### Automated Deployment
```bash
# Safe deployment with automatic testing
npm run deploy:safe

# Custom deployment with tests
./deploy-with-tests.sh dev us-west-2 YOUR_API_KEY
```

### CI/CD Integration
```bash
# In your CI/CD pipeline
npm run test:pre-deploy && npm run deploy
```

## 📊 Test Results

### Success Output
```
📊 Test Summary
===============
Total Tests: 30
Passed: 30
Failed: 0

✅ All tests passed! ✨ Ready for deployment
```

### Failure Output
```
📊 Test Summary
===============
Total Tests: 30
Passed: 28
Failed: 2

❌ 2 test(s) failed! Fix issues before deployment
```

## 🔧 Troubleshooting

### Common Issues

**JavaScript Syntax Errors**
```bash
❌ Main application syntax
```
- Check for missing semicolons, brackets, or syntax errors
- Run `node -c src/index.js` for detailed error messages

**Missing Dependencies**
```bash
❌ NPM dependencies check
```
- Run `npm install` to install missing packages
- Check for version conflicts with `npm ls`

**Docker Issues**
```bash
❌ Docker daemon running
```
- Start Docker Desktop or Docker service
- Verify with `docker info`

**AWS CLI Issues**
```bash
❌ AWS CLI available
```
- Install AWS CLI: https://aws.amazon.com/cli/
- Configure credentials: `aws configure`

**Application Health Check Failures**
```bash
❌ Deployed application health
```
- Application may not be deployed yet (normal for first deployment)
- Check if ALB DNS is accessible
- Verify application is running in ECS

### Manual Verification

If tests fail, you can manually verify components:

```bash
# Check JavaScript syntax
node -c src/index.js

# Verify imports work
node -e "require('./src/services/awsServices')"

# Test Docker configuration
docker-compose config

# Check AWS connectivity
aws sts get-caller-identity

# Verify application health (if deployed)
curl http://your-alb-dns/api/health
```

## 🎯 Best Practices

### Before Every Deployment
1. **Always run pre-deployment tests**: `npm run test:pre-deploy`
2. **Use safe deployment**: `npm run deploy:safe`
3. **Review test failures** before proceeding
4. **Verify application health** after deployment

### Development Workflow
1. Make code changes
2. Run `npm run test:pre-deploy`
3. Fix any failing tests
4. Deploy with `npm run deploy:safe`
5. Verify deployment success

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Pre-Deployment Tests
  run: npm run test:pre-deploy

- name: Deploy if Tests Pass
  run: npm run deploy
  if: success()
```

## 📈 Test Coverage

The test suite covers:
- **30+ individual tests** across 7 categories
- **Syntax validation** for all JavaScript files
- **Dependency integrity** checks
- **Configuration validation**
- **Security best practices**
- **Deployment prerequisites**
- **Live application health** (if deployed)

## 🔄 Continuous Improvement

The test suite is designed to be:
- **Extensible**: Easy to add new tests
- **Fast**: Completes in under 30 seconds
- **Reliable**: Consistent results across environments
- **Informative**: Clear error messages and guidance

### Adding New Tests

To add a new test to the suite:

1. Edit `scripts/pre-deploy-tests.sh`
2. Add your test using the `run_test` function:
```bash
run_test "Your test name" "your_test_command"
```
3. Test the updated suite: `npm run test:pre-deploy`

## 📞 Support

If you encounter issues with the test suite:

1. **Check the troubleshooting section** above
2. **Run individual test commands** manually for detailed error messages
3. **Verify prerequisites** (Node.js, Docker, AWS CLI)
4. **Review application logs** if health checks fail

The test suite is designed to catch issues early and provide clear guidance for resolution.