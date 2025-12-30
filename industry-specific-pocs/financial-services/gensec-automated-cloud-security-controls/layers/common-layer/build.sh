#!/bin/bash

# Build script for common layer
set -e

echo "Building common layer..."

# Backup custom modules before cleaning
CUSTOM_MODULES=(
    "s3_operations.py"
    "service_name_resolver.py"
)

BACKUP_DIR=$(mktemp -d)
echo "Backing up custom modules to $BACKUP_DIR"

for module in "${CUSTOM_MODULES[@]}"; do
    if [ -f "python/$module" ]; then
        cp "python/$module" "$BACKUP_DIR/"
        echo "  Backed up: $module"
    fi
done

# Clean previous build
rm -rf python/

# Create python directory
mkdir -p python/

# Install dependencies
pip3 install -r requirements.txt -t python/

# Restore custom modules
echo "Restoring custom modules..."
for module in "${CUSTOM_MODULES[@]}"; do
    if [ -f "$BACKUP_DIR/$module" ]; then
        cp "$BACKUP_DIR/$module" "python/"
        echo "  Restored: $module"
    fi
done

# Clean up backup
rm -rf "$BACKUP_DIR"

# Remove unnecessary files to reduce layer size
find python/ -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find python/ -name "*.pyc" -delete 2>/dev/null || true
find python/ -name "*.pyo" -delete 2>/dev/null || true
find python/ -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find python/ -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

echo "Common layer build complete!"
echo "Layer contents:"
ls -la python/
