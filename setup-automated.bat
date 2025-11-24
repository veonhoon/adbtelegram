@echo off
setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════╗
echo ║   ADB Tracker Bot - Automated Setup    ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM Check if ADB is installed
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ADB is not installed!
    echo Please install Android Platform Tools
    pause
    exit /b 1
)

echo ✓ Node.js found
echo ✓ ADB found
echo.

REM Install dependencies
echo → Installing dependencies...
call npm install >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Build TypeScript
echo → Building TypeScript...
call npm run build >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to build TypeScript
    pause
    exit /b 1
)
echo ✓ Build successful
echo.

REM Interactive configuration
echo ══════════════════════════════════════════
echo           CONFIGURATION SETUP
echo ══════════════════════════════════════════
echo.

set /p BOT_TOKEN="Enter Telegram Bot Token: "
set /p CHAT_ID="Enter Telegram Chat/Group ID: "
set /p SERVER_ID="Enter Server ID (e.g., server-1): "
set /p SERVER_NAME="Enter Server Name (e.g., Rack 1): "

echo.
echo → Is this the main server or an agent?
echo   1. Main Server (runs bot + monitor)
echo   2. Agent Server (monitor only)
set /p SERVER_TYPE="Select [1/2]: "

if "%SERVER_TYPE%"=="1" (
    set MODE=standalone
    set DB_PATH=C:\ADBTracker\adb_tracker.db

    REM Create database folder
    if not exist "C:\ADBTracker" mkdir "C:\ADBTracker"

    echo.
    echo ⚠️  IMPORTANT: Share the folder C:\ADBTracker on the network
    echo    So other servers can access the database.
    echo.
) else (
    set MODE=agent
    set /p MAIN_SERVER="Enter main server name (e.g., Server1): "
    set DB_PATH=\\!MAIN_SERVER!\ADBTracker\adb_tracker.db
)

REM Create .env file
echo → Creating configuration file...
(
echo # Telegram Bot Configuration
echo TELEGRAM_BOT_TOKEN=%BOT_TOKEN%
echo TELEGRAM_ADMIN_CHAT_ID=%CHAT_ID%
echo.
echo # Server Configuration
echo SERVER_ID=%SERVER_ID%
echo SERVER_NAME=%SERVER_NAME%
echo.
echo # Monitoring Configuration
echo CHECK_INTERVAL_SECONDS=30
echo.
echo # Database Configuration
echo DB_PATH=%DB_PATH%
echo.
echo # Mode
echo MODE=%MODE%
) > .env

echo ✓ Configuration saved
echo.

echo ══════════════════════════════════════════
echo           DEVICE DISCOVERY
echo ══════════════════════════════════════════
echo.

echo → Scanning for ADB devices...
adb devices -l
echo.

echo ✓ Setup complete!
echo.
echo Next steps:
echo 1. Start the bot: npm start
echo 2. In Telegram, send /start to your bot
echo 3. Send /notify to enable notifications
echo.

if "%MODE%"=="standalone" (
    echo IMPORTANT: Share C:\ADBTracker folder for multi-server setup
    echo.
)

pause
