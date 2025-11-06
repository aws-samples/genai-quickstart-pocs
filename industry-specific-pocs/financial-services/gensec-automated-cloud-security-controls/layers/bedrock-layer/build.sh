#!/bin/bash

echo "Building Bedrock Layer..."
mkdir -p python

if [ -f requirements.txt ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt -t python/
fi

echo "Bedrock Layer build complete!"
find python -name "*.py" | head -5
