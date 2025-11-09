#!/bin/bash
set -e

echo "Building all layers..."

for layer in */; do
    if [ -f "$layer/requirements.txt" ]; then
        echo "Building $layer"
        cd "$layer"
        mkdir -p python
        pip install -r requirements.txt -t python/ 2>/dev/null || true
        cd ..
    elif [ -f "$layer/build.sh" ]; then
        echo "Building $layer with custom build script"
        cd "$layer"
        ./build.sh
        cd ..
    fi
done

echo "All layers built. Run 'cdk deploy' to deploy."
