#!/bin/bash

# Build script for MCP Tools Layer
# Installs MCP client dependencies

set -e

echo "Building MCP Tools Layer..."

# Create python directory if it doesn't exist
mkdir -p python

# Install Python dependencies for MCP integration
echo "Installing Python dependencies..."
pip install --target python/ requests beautifulsoup4 lxml

echo "MCP Tools Layer build completed successfully!"
echo "Layer contents:"
ls -la python/