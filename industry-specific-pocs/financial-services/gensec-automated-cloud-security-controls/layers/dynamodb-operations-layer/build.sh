#!/bin/bash

# Build script for DynamoDB Operations Layer
echo "Building DynamoDB Operations Layer..."

# Create python directory if it doesn't exist
mkdir -p python

# Install dependencies if requirements.txt exists
if [ -f requirements.txt ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt -t python/
fi

echo "DynamoDB Operations Layer build complete!"
echo "Layer structure:"
find python -type f -name "*.py" | head -10
