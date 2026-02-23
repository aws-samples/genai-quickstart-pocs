#!/bin/bash
# Setup script for BetterBank Debit Card Workflow

set -e

echo "Setting up BetterBank Debit Card Workflow..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Check if directory name contains problematic characters
current_dir=$(basename "$PWD")
if [[ "$current_dir" == *":"* ]]; then
    echo ""
    echo "⚠️  Warning: Directory name contains ':' which causes issues with Python venv"
    echo "   Current directory: $current_dir"
    echo ""
    echo "Installing dependencies without virtual environment..."
    echo ""
    
    # Install dependencies directly
    pip3 install --upgrade pip
    pip3 install -r requirements.txt
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Note: Dependencies installed globally (no venv due to directory name)"
    echo "Consider renaming directory to avoid ':' character"
    echo ""
else
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate

    # Install dependencies
    echo "Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "To activate the virtual environment, run:"
    echo "  source venv/bin/activate"
    echo ""
fi

echo "To create DynamoDB tables, run:"
echo "  python3 scripts/create_tables.py"
echo ""
echo "To seed mock data, run:"
echo "  python3 scripts/seed_data.py"
echo ""
echo "To test the API, run:"
echo "  python3 scripts/test_local.py"
echo ""
