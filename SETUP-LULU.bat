@echo off
REM ═══════════════════════════════════════════════════════════════
REM   LULU SERVER - COMPLETE SETUP SCRIPT (MAIN SERVER)
REM   This script sets up the ADB Tracker Bot on Lulu (main server)
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                   LULU SERVER SETUP                            ║
echo ║         ADB Tracker Bot (Main Server + Telegram)              ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

cd "%~dp0"

REM Step 1: Create and share database folder
echo [1/7] Setting up shared database folder...
if not exist "C:\ADBTracker" (
    mkdir C:\ADBTracker
    echo ✓ Created C:\ADBTracker folder
) else (
    echo ✓ C:\ADBTracker folder already exists
)

REM Copy database to shared location
if exist "adb_tracker.db" (
    copy adb_tracker.db C:\ADBTracker\ >nul 2>&1
    echo ✓ Database copied to shared folder
)
echo.

echo ⚠️  IMPORTANT: You must share C:\ADBTracker manually:
echo    1. Right-click C:\ADBTracker → Properties
echo    2. Sharing → Advanced Sharing
echo    3. Check "Share this folder"
echo    4. Share name: ADBTracker
echo    5. Permissions: Full Control
echo.
pause
echo.

REM Step 2: Copy Lulu configuration
echo [2/7] Copying Lulu configuration files...
copy deployment\lulu\.env . >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Could not copy .env file
    echo    Make sure deployment\lulu\.env exists
    pause
    exit /b 1
)
echo ✓ Configuration files copied
echo.

REM Step 3: Update .env to use shared database
echo [3/7] Updating configuration for shared database...
echo # Telegram Bot Configuration > .env.temp
echo TELEGRAM_BOT_TOKEN=8580518121:AAHCWEa64fcl23PGUmQBzfOcuPpQ4FxQo7E >> .env.temp
echo TELEGRAM_ADMIN_CHAT_ID= >> .env.temp
echo. >> .env.temp
echo # Server Configuration >> .env.temp
echo SERVER_ID=lulu >> .env.temp
echo SERVER_NAME=Lulu >> .env.temp
echo MODE=standalone >> .env.temp
echo. >> .env.temp
echo # Database Path (SHARED LOCATION) >> .env.temp
echo DB_PATH=C:\ADBTracker\adb_tracker.db >> .env.temp
echo. >> .env.temp
echo # Monitoring >> .env.temp
echo CHECK_INTERVAL_SECONDS=30 >> .env.temp

move /Y .env.temp .env >nul 2>&1
echo ✓ Configuration updated
echo.

REM Step 4: Initialize expected devices
echo [4/7] Initializing expected devices (31 phones)...
node initialize-expected-devices.js
if %errorlevel% neq 0 (
    echo ❌ Error: Device initialization failed
    pause
    exit /b 1
)
echo.

REM Step 5: Rename connected devices
echo [5/7] Renaming connected devices...
node rename-devices.js
if %errorlevel% neq 0 (
    echo ❌ Warning: Device renaming failed
)
echo.

REM Step 6: Check for existing PM2 process
echo [6/7] Checking for existing PM2 process...
pm2 delete adb-lulu >nul 2>&1
echo ✓ Ready to start
echo.

REM Step 7: Start with PM2
echo [7/7] Starting ADB Tracker Bot for Lulu...
pm2 start npm --name "adb-lulu" -- start
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
echo ✅ LULU SETUP COMPLETE!
echo.
echo 📊 Quick Commands:
echo    pm2 list              - View running processes
echo    pm2 logs adb-lulu     - View logs
echo    pm2 restart adb-lulu  - Restart bot
echo    pm2 stop adb-lulu     - Stop bot
echo.
echo 📱 Test in Telegram:
echo    /start                - Initialize bot
echo    /notify               - Enable notifications
echo    /servers              - Should show Lulu server
echo    /status               - Should show 31 phones
echo.
echo 🌐 Next Steps:
echo    1. Test bot in Telegram
echo    2. Deploy to other servers (Opti, Mini, Paso, Dojang)
echo    3. Each server will connect to this shared database
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
