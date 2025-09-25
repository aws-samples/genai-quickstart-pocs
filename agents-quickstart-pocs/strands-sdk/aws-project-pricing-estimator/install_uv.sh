#!/bin/bash

# UV Installation Script for macOS/Linux
# This script helps install UV on Unix-like systems

echo ""
echo "========================================"
echo "   UV Installation Script for Unix"
echo "========================================"
echo ""

echo "Installing UV package manager..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://python.org first"
    exit 1
fi

echo "Python found. Checking for existing UV installation..."
echo ""

# Check if UV is already installed
if command -v uv &> /dev/null; then
    echo "UV is already installed!"
    uv --version
    echo ""
    echo "You can now use UV for faster Python package management."
    exit 0
fi

echo "UV not found. Installing now..."
echo ""

# Detect operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Detected macOS. Trying Homebrew installation..."
    
    if command -v brew &> /dev/null; then
        echo "Installing UV via Homebrew..."
        brew install uv
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "SUCCESS: UV installed via Homebrew!"
            echo ""
            echo "Testing UV installation..."
            uv --version
            if [ $? -eq 0 ]; then
                echo ""
                echo "UV is now ready to use!"
                exit 0
            else
                echo "UV installed but not working. Please restart your terminal."
                exit 1
            fi
        else
            echo "Homebrew installation failed."
        fi
    else
        echo "Homebrew not found. Trying pip installation..."
    fi
fi

# Try pip installation (works on all platforms)
echo "Installing UV via pip..."
pip3 install uv --upgrade

if [ $? -eq 0 ]; then
    echo ""
    echo "SUCCESS: UV installed via pip!"
    echo ""
    echo "Testing UV installation..."
    uv --version
    if [ $? -eq 0 ]; then
        echo ""
        echo "UV is now ready to use!"
        echo ""
        echo "Note: If you get 'uv: command not found' error,"
        echo "      restart your terminal or add UV to PATH manually."
        exit 0
    else
        echo ""
        echo "UV installed but not working. Trying to fix PATH..."
        echo ""
        echo "Please restart your terminal and try again."
        echo "If the issue persists, try the manual installation method."
        exit 1
    fi
fi

# Try cargo installation (if available)
if command -v cargo &> /dev/null; then
    echo ""
    echo "Pip installation failed. Trying Cargo..."
    echo "Installing UV via Cargo..."
    cargo install uv
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "SUCCESS: UV installed via Cargo!"
        echo ""
        echo "Testing UV installation..."
        uv --version
        if [ $? -eq 0 ]; then
            echo ""
            echo "UV is now ready to use!"
            exit 0
        else
            echo "UV installed but not working. Please restart your terminal."
            exit 1
        fi
    fi
fi

echo ""
echo "All installation methods failed."
echo ""
echo "Manual installation required:"
echo "1. Visit: https://github.com/astral-sh/uv/releases"
echo "2. Download the appropriate binary for your system"
echo "3. Make it executable: chmod +x uv"
echo "4. Move to PATH: sudo mv uv /usr/local/bin/"
echo ""
echo "Alternative solutions:"
echo "- Try running with sudo"
echo "- Check your PATH environment variable"
echo "- Ensure you have the latest pip: pip3 install --upgrade pip"
echo "- Check if your system has the required build tools"
echo ""
exit 1
