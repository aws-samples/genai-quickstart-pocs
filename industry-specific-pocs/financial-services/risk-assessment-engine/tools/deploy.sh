#!/bin/bash

# Deployment script for agentic customer risk assessment engine
set -e

ENVIRONMENT=${1:-dev}

echo "Deploying Agentic Customer Risk Assessment Engine to $ENVIRONMENT..."

# Build first
./tools/build.sh

# Deploy infrastructure
echo "Deploying infrastructure..."
npm run deploy:$ENVIRONMENT

echo "Agentic Customer Risk Assessment Engine deployment to $ENVIRONMENT completed successfully!"