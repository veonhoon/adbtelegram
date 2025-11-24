@echo off
REM ═══════════════════════════════════════════════════════════════
REM   DOJANG SERVER - COMPLETE SETUP SCRIPT
REM   This script sets up the ADB Tracker Agent on Dojang server
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                  DOJANG SERVER SETUP                           ║
echo ║            ADB Tracker Agent Installation                      ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

cd "%~dp0"

REM Step 1: Copy server-specific files
echo [1/6] Copying Dojang configuration files...
copy deployment\dojang\.env . >nul 2>&1
copy deployment\dojang\rename-devices.js . >nul 2>&1
copy start-pm2-agent.bat . >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Could not copy configuration files
    echo    Make sure deployment\dojang\ folder exists
    pause
    exit /b 1
)
echo ✓ Configuration files copied
echo.

REM Step 2: Test database access
echo [2/6] Testing database connection to Lulu...
dir \\lulu\ADBTracker\adb_tracker.db >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Cannot access \\lulu\ADBTracker\adb_tracker.db
    echo    Make sure:
    echo    1. Lulu server is online
    echo    2. C:\ADBTracker folder is shared on Lulu
    echo    3. You have network access to Lulu
    pause
    exit /b 1
)
echo ✓ Database connection successful
echo.

REM Step 3: Initialize expected devices
echo [3/6] Initializing expected devices (13 phones)...
node initialize-expected-devices.js
if %errorlevel% neq 0 (
    echo ❌ Error: Device initialization failed
    pause
    exit /b 1
)
echo.

REM Step 4: Rename connected devices
echo [4/6] Renaming connected devices...
node rename-devices.js
if %errorlevel% neq 0 (
    echo ❌ Warning: Device renaming failed (this is OK if no devices are connected yet)
)
echo.

REM Step 5: Check for existing PM2 process
echo [5/6] Checking for existing PM2 process...
pm2 delete adb-dojang >nul 2>&1
echo ✓ Ready to start
echo.

REM Step 6: Start with PM2
echo [6/6] Starting ADB Tracker Agent for Dojang...
pm2 start npm --name "adb-dojang" -- start
if %errorlevel% neq 0 (
    echo ❌ Error: Failed to start with PM2
    pause
    exit /b 1
)
echo.

REM Save PM2 configuration
pm2 save >nul 2>&1

echo ═══════════════════════════════════════════════════════════════
echo.
echo ✅ DOJANG SETUP COMPLETE!
echo.
echo 📊 Quick Commands:
echo    pm2 list                - View running processes
echo    pm2 logs adb-dojang     - View logs
echo    pm2 restart adb-dojang  - Restart agent
echo    pm2 stop adb-dojang     - Stop agent
echo.
echo 📱 Test in Telegram:
echo    /servers                - Should show Dojang server
echo    /devices dojang         - Should show 13 phones
echo    /status                 - Should show all servers
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
