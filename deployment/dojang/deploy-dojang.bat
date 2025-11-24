@echo off
echo ═══════════════════════════════════════
echo   ADB Tracker - DOJANG Setup
echo ═══════════════════════════════════════
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Install from nodejs.org
    pause
    exit /b 1
)

REM Check ADB
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ADB not found! Install Android Platform Tools
    pause
    exit /b 1
)

echo ✓ Prerequisites OK
echo.

REM Install and build (if needed)
if not exist "node_modules" (
    echo → Installing dependencies...
    call npm install
)

if not exist "dist" (
    echo → Building project...
    call npm run build
)

echo.
echo → Running device rename script...
node rename-devices.js
echo.

echo ═══════════════════════════════════════
echo   Starting DOJANG Monitor
echo ═══════════════════════════════════════
echo.

echo This is an AGENT server - Monitor only
echo Press Ctrl+C to stop
echo.

npm start
