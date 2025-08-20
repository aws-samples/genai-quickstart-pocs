#!/bin/bash

# AWS Pricing Agent Chatbot Launcher for macOS/Linux
# This shell script provides an easy way to run the chatbot on Unix-like systems

echo ""
echo "========================================"
echo "  AWS Pricing Agent Chatbot Launcher"
echo "========================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://python.org first"
    exit 1
fi

# Check if UV is available
if command -v uv &> /dev/null; then
    echo "UV found! Using UV for dependency management."
    echo ""
else
    echo "UV not found. Using pip for dependency management."
    echo "Consider installing UV for faster installations:"
    echo "  macOS: brew install uv"
    echo "  Linux: pip install uv"
    echo ""
fi

# Check if virtual environment exists
if [ ! -f "venv/bin/activate" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if [ ! -d "venv/lib/python*/site-packages/streamlit" ]; then
    echo "Installing dependencies..."
    
    # Try UV first if available
    if command -v uv &> /dev/null; then
        echo "Using UV to install dependencies..."
        uv pip install -r requirements.txt --force-reinstall
        if [ $? -ne 0 ]; then
            echo "UV installation failed, trying pip..."
            pip install -r requirements.txt
        fi
    else
        echo "Using pip to install dependencies..."
        pip install -r requirements.txt
    fi
    
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if streamlit is available
python -c "import streamlit" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Streamlit not found. Installing..."
    
    # Try UV first if available
    if command -v uv &> /dev/null; then
        echo "Using UV to install Streamlit with force reinstall..."
        uv pip install streamlit --force-reinstall
        if [ $? -ne 0 ]; then
            echo "UV Streamlit installation failed, trying pip..."
            pip install streamlit
        fi
    else
        echo "Using pip to install Streamlit..."
        pip install streamlit
    fi
    
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install Streamlit"
        exit 1
    fi
    
    # Check again after installation
    python -c "import streamlit" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "ERROR: Streamlit still not available after installation"
        echo "This may be a UV metadata-only installation issue."
        echo "Trying pip installation as fallback..."
        pip install streamlit --force-reinstall
        if [ $? -ne 0 ]; then
            echo "ERROR: All installation methods failed"
            exit 1
        fi
    fi
fi

echo ""
echo "Starting AWS Pricing Agent Chatbot..."
echo "The app will open in your browser at: http://localhost:8501"
echo "Press Ctrl+C to stop the server"
echo ""

# Run the chatbot
python run_chatbot.py

# If we get here, the app was closed
echo ""
echo "Chatbot stopped." 