#!/bin/bash

# Build script for requests layer
set -e

echo "Building requests layer..."

# Clean previous build
rm -rf python/

# Create python directory
mkdir -p python/

# Install dependencies
pip3 install -r requirements.txt -t python/

# Remove unnecessary files to reduce layer size
find python/ -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find python/ -name "*.pyc" -delete 2>/dev/null || true
find python/ -name "*.pyo" -delete 2>/dev/null || true
find python/ -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find python/ -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

echo "Requests layer build complete!"
echo "Layer contents:"
ls -la python/
