#!/bin/bash

# Build script for agentic customer risk assessment engine
set -e

echo "Building Agentic Customer Risk Assessment Engine..."

# Clean previous builds
echo "Cleaning previous builds..."
npm run clean

# Install dependencies
echo "Installing dependencies..."
npm install

# Type checking
echo "Running type checks..."
npm run typecheck

# Linting
echo "Running linting..."
npm run lint

# Testing
echo "Running tests..."
npm run test

# Building
echo "Building packages..."
npm run build

echo "Agentic Customer Risk Assessment Engine build completed successfully!"