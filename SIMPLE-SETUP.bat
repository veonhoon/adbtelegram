@echo off
REM ════════════════════════════════════════════════════════════
REM   ADB Tracker Bot - Simple One-Click Setup
REM ════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════╗
echo ║   ADB Tracker Bot - Simple Setup       ║
echo ╚════════════════════════════════════════╝
echo.

REM Install dependencies (first time only)
if not exist "node_modules" (
    echo → Installing dependencies...
    call npm install
    echo.
)

REM Build (first time or after updates)
if not exist "dist" (
    echo → Building project...
    call npm run build
    echo.
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating configuration file...
    (
    echo # Telegram Bot Configuration
    echo TELEGRAM_BOT_TOKEN=8580518121:AAHCWEa64fcl23PGUmQBzfOcuPpQ4FxQo7E
    echo TELEGRAM_ADMIN_CHAT_ID=
    echo.
    echo # Server Configuration
    echo SERVER_ID=server-1
    echo SERVER_NAME=Main Server
    echo.
    echo # Monitoring Configuration
    echo CHECK_INTERVAL_SECONDS=30
    echo.
    echo # Database Configuration
    echo DB_PATH=
    echo.
    echo # Mode
    echo MODE=standalone
    ) > .env

    echo.
    echo ══════════════════════════════════════════
    echo   IMPORTANT: Get Your Chat ID
    echo ══════════════════════════════════════════
    echo.
    echo 1. Open Telegram
    echo 2. Search for @userinfobot
    echo 3. Send /start to it
    echo 4. Copy the number it gives you
    echo.
    set /p CHAT_ID="Enter your Telegram Chat ID: "

    REM Update .env with chat ID
    powershell -Command "(gc .env) -replace 'TELEGRAM_ADMIN_CHAT_ID=', 'TELEGRAM_ADMIN_CHAT_ID=%CHAT_ID%' | Out-File -encoding ASCII .env"

    echo ✓ Configuration saved!
    echo.
)

echo ══════════════════════════════════════════
echo   Starting ADB Tracker Bot
echo ══════════════════════════════════════════
echo.
echo 💡 Open Telegram and message your bot!
echo 💡 Commands: /start, /status, /help, /notify
echo.
echo Press Ctrl+C to stop the bot
echo.

REM Start the bot
npm start

pause
