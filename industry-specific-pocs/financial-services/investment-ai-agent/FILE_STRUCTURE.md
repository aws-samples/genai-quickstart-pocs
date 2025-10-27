# Investment AI Agent - File Structure

## 📁 Project Organization

### 🚀 **Production Files (Keep)**

#### Core Application
- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript output
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `cdk.json` - AWS CDK configuration

#### Documentation
- `README.md` - Main project documentation
- `docs/PRODUCTION_INTEGRATION_GUIDE.md` - **Primary API documentation**
- `docs/logging-and-auditing.md` - Logging and monitoring
- `DEPLOYMENT.md` - Deployment instructions

#### Testing & Validation
- `test-async-api.js` - **Complete async API workflow test (80s)**
- `test-production-ready.js` - **Quick validation test (30s)**
- `jest.config.js` - Jest test configuration
- `src/__tests__/` - Unit tests

#### Infrastructure
- `cdk.out/` - CDK deployment artifacts
- `scripts/` - Deployment and utility scripts
- `config/` - Environment configurations

### 🗑️ **Files Removed (Redundant)**

#### Duplicate Documentation
- ~~`docs/API_DOCUMENTATION.md`~~ - Merged into production guide
- ~~`docs/DEMO_API_GUIDE.md`~~ - Merged into production guide
- ~~`QUICK-DEMO-DEPLOY.md`~~ - Covered by main deployment guide

#### Obsolete Test Files
- ~~`test-communication.js`~~ - Replaced by comprehensive async test
- ~~`test-multi-agent.js`~~ - Replaced by comprehensive async test
- ~~`test-server.js`~~ - No longer needed with production API
- ~~`test-presentation.html`~~ - Replaced by live production UI

## 🎯 **Current Status**

### Available APIs
1. **Demo API** - Fast Claude Sonnet 3.7 responses (3-5s)
2. **Production Async API** - Full 5-agent orchestration (60-80s)

### 📚 Documentation Hierarchy
1. `README.md` - Overview and quick start
2. `docs/PRODUCTION_INTEGRATION_GUIDE.md` - Complete API reference
3. `DEPLOYMENT.md` - Infrastructure deployment

### 🧪 Testing Strategy
1. `node test-production-ready.js` - Quick validation (30s)
2. `node test-async-api.js` - Full workflow test (80s)
3. `npm test` - Unit tests

## 🌐 **Live URLs**

- **Demo UI**: https://fflo4lgd6d.execute-api.us-west-2.amazonaws.com/v1/
- **Demo API**: https://fflo4lgd6d.execute-api.us-west-2.amazonaws.com/v1/api/v1/demo/ideas
- **Production API**: https://fflo4lgd6d.execute-api.us-west-2.amazonaws.com/v1/api/v1/ideas/async

## 📋 **Next Steps**

1. **Customer Integration**: Use production integration guide
2. **Monitoring**: Review logging and auditing documentation
3. **Scaling**: Follow deployment guide for additional environments
4. **Testing**: Run both test scripts before any changes

The system is production-ready with clean, organized documentation.