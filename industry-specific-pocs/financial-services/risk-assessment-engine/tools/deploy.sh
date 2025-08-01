#!/bin/bash

# Deployment script for risk assessment engine
set -e

ENVIRONMENT=${1:-dev}

echo "Deploying Risk Assessment Engine to $ENVIRONMENT..."

# Build first
./tools/build.sh

# Deploy infrastructure
echo "Deploying infrastructure..."
npm run deploy:$ENVIRONMENT

echo "Deployment to $ENVIRONMENT completed successfully!"