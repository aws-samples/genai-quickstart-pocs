#!/usr/bin/env python3
"""
test_uv_installation.py
-----------------------
Test script to verify UV installation and dependency checking works correctly.

This script tests the same functions used by the launcher scripts to ensure
they work properly across different platforms and scenarios.
"""
import subprocess
import sys
import platform
import shutil

def test_uv_detection():
    """Test UV detection functionality."""
    print("🔍 Testing UV detection...")
    
    # Check if UV is available
    uv_path = shutil.which("uv")
    if uv_path:
        print(f"✅ UV found at: {uv_path}")
        
        # Test UV version
        try:
            result = subprocess.run(["uv", "--version"], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ UV version: {result.stdout.strip()}")
            return True
        except subprocess.CalledProcessError:
            print("❌ UV found but version check failed")
            return False
    else:
        print("❌ UV not found in PATH")
        return False

def test_streamlit_check():
    """Test Streamlit availability check."""
    print("\n🔍 Testing Streamlit availability...")
    
    try:
        import streamlit
        print(f"✅ Streamlit imported successfully: {streamlit.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Streamlit import failed: {e}")
        return False

def test_uv_installation():
    """Test UV installation functionality."""
    print("\n🔍 Testing UV installation...")
    
    if not test_uv_detection():
        print("❌ UV not available for testing installation")
        return False
    
    try:
        # Test installing a simple package
        print("📦 Testing UV package installation...")
        result = subprocess.run(["uv", "pip", "install", "requests", "--force-reinstall"], 
                              capture_output=True, text=True, check=True)
        print("✅ UV package installation test successful")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ UV package installation test failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def test_platform_info():
    """Display platform information."""
    print("\n🖥️  Platform Information:")
    print(f"   OS: {platform.system()}")
    print(f"   Version: {platform.version()}")
    print(f"   Architecture: {platform.machine()}")
    print(f"   Python: {sys.version}")
    print(f"   Python Executable: {sys.executable}")

def main():
    """Run all tests."""
    print("🚀 UV Installation and Dependency Test Suite")
    print("=" * 50)
    
    # Display platform info
    test_platform_info()
    
    # Run tests
    tests = [
        ("UV Detection", test_uv_detection),
        ("Streamlit Check", test_streamlit_check),
        ("UV Installation", test_uv_installation),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n   Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! UV and dependencies are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
