@echo off
REM ADB Tracker Bot - Quick Setup Script for Windows

echo ╔════════════════════════════════════════╗
echo ║   ADB Tracker Bot - Quick Setup        ║
echo ╚════════════════════════════════════════╝
echo.

REM Check Node.js
echo → Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js found
node -v

REM Check ADB
echo → Checking ADB...
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ADB is not installed!
    echo.
    echo Please install Android SDK Platform Tools:
    echo Download from https://developer.android.com/studio/releases/platform-tools
    echo Add platform-tools folder to your System PATH
    pause
    exit /b 1
)

echo ✓ ADB found
adb version

REM Check for connected devices
echo → Checking for connected devices...
adb devices

REM Install dependencies
echo.
echo → Installing Node.js dependencies...
call npm install

REM Setup .env
echo.
echo → Setting up configuration...

if exist .env (
    echo ⚠️  .env file already exists, skipping...
) else (
    copy .env.example .env
    echo ✓ Created .env file from template
    echo.
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo 📝 IMPORTANT: Configure your .env file
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo You need to add your Telegram bot credentials:
    echo.
    echo 1. Create a bot with @BotFather on Telegram
    echo 2. Get your chat ID from @userinfobot
    echo 3. Edit .env and add:
    echo    • TELEGRAM_BOT_TOKEN
    echo    • TELEGRAM_ADMIN_CHAT_ID
    echo.
    pause
    notepad .env
)

REM Build
echo.
echo → Building TypeScript...
call npm run build

echo.
echo ╔════════════════════════════════════════╗
echo ║        Setup Complete! ✓               ║
echo ╚════════════════════════════════════════╝
echo.
echo Next steps:
echo.
echo 1. Make sure your .env is configured correctly
echo 2. Start the bot with: npm start
echo 3. Message your bot on Telegram with /start
echo.
echo For detailed instructions, see QUICK-START.md
echo.
pause
