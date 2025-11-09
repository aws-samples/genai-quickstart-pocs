#!/bin/bash

echo "Building Validation Layer..."
mkdir -p python

if [ -f requirements.txt ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt -t python/
fi

echo "Validation Layer build complete!"
find python -name "*.py" | head -5
