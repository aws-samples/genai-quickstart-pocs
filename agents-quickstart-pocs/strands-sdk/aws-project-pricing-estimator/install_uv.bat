@echo off
REM UV Installation Script for Windows
REM This script helps install UV on Windows systems

echo.
echo ========================================
echo   UV Installation Script for Windows
echo ========================================
echo.

echo Installing UV package manager...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org first
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python found. Checking for existing UV installation...
echo.

REM Check if UV is already installed
uv --version >nul 2>&1
if not errorlevel 1 (
    echo UV is already installed!
    uv --version
    echo.
    echo You can now use UV for faster Python package management.
    pause
    exit /b 0
)

echo UV not found. Installing now...
echo.

REM Try pip installation first (most reliable)
echo Method 1: Installing via pip...
pip install uv --upgrade
if not errorlevel 1 (
    echo.
    echo SUCCESS: UV installed via pip!
    echo.
    echo Testing UV installation...
    uv --version
    if not errorlevel 1 (
        echo.
        echo UV is now ready to use!
        echo.
        echo Note: If you get 'uv is not recognized' error,"
        echo "      restart your terminal or add UV to PATH manually."
        pause
        exit /b 0
    ) else (
        echo.
        echo UV installed but not working. Trying to fix PATH...
        echo.
        echo Please restart your terminal and try again.
        echo If the issue persists, try the manual installation method.
        pause
        exit /b 1
    )
)

echo.
echo Pip installation failed. Trying winget...
echo.

REM Try winget installation
winget install astral-sh.uv >nul 2>&1
if not errorlevel 1 (
    echo.
    echo SUCCESS: UV installed via winget!
    echo.
    echo Note: You may need to restart your terminal or add UV to PATH
    echo UV is typically installed to: C:\Program Files\uv\uv.exe
    echo.
    echo Testing UV installation...
    timeout /t 3 >nul
    uv --version >nul 2>&1
    if not errorlevel 1 (
        echo UV is working correctly!
        pause
        exit /b 0
    ) else (
        echo UV installed but not in PATH. Please restart your terminal.
        pause
        exit /b 0
    )
)

echo.
echo Both pip and winget installations failed.
echo.
echo Manual installation required:
echo 1. Visit: https://github.com/astral-sh/uv/releases
echo 2. Download the latest Windows .exe file (uv-windows-x64.exe)
echo 3. Run the installer or extract to a folder
echo 4. Add the UV folder to your system PATH
echo.
echo Alternative solutions:
echo - Try running as Administrator
echo - Check if your antivirus is blocking the installation
echo - Ensure you have the latest pip: python -m pip install --upgrade pip
echo.
pause
exit /b 1
