@echo off
echo ╔═══════════════════════════════════════════════════════╗
echo ║  ADB Tracker - Complete Multi-Server Deployment       ║
echo ║  Total: 122 Phones across 5 Servers                   ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo 📦 STEP 1: Preparing Deployment Packages
echo ═══════════════════════════════════════════════════════
call prepare-deployments.bat

echo.
echo 📁 STEP 2: Setup Shared Database on Lulu
echo ═══════════════════════════════════════════════════════
echo.
echo Creating C:\ADBTracker folder...
if not exist "C:\ADBTracker" mkdir "C:\ADBTracker"

echo Copying database...
copy /Y adb_tracker.db C:\ADBTracker\

echo.
echo ⚠️  MANUAL STEP REQUIRED:
echo    1. Right-click C:\ADBTracker
echo    2. Properties → Sharing → Advanced Sharing
echo    3. Share name: ADBTracker
echo    4. Permissions: Full Control
echo.
pause

echo.
echo 📝 STEP 3: Update Lulu Configuration
echo ═══════════════════════════════════════════════════════
echo Updating .env to use shared database...

(
echo # Telegram Bot Configuration
echo TELEGRAM_BOT_TOKEN=8580518121:AAHCWEa64fcl23PGUmQBzfOcuPpQ4FxQo7E
echo TELEGRAM_ADMIN_CHAT_ID=
echo.
echo # Server Configuration
echo SERVER_ID=lulu
echo SERVER_NAME=Lulu
echo.
echo # Monitoring
echo CHECK_INTERVAL_SECONDS=30
echo.
echo # Database
echo DB_PATH=C:\ADBTracker\adb_tracker.db
echo.
echo # Mode
echo MODE=standalone
) > .env

echo ✓ Configuration updated!

echo.
echo 📊 DEPLOYMENT SUMMARY
echo ═══════════════════════════════════════════════════════
echo.
echo ✅ Lulu (Main)   : 31 phones - Bot + Monitor
echo ✅ Opti (Agent)  : 29 phones - Monitor only
echo ✅ Mini (Agent)  : 19 phones - Monitor only
echo ✅ Paso (Agent)  : 24 phones - Monitor only
echo ✅ Dojang (Agent): 13 phones - Monitor only
echo    ────────────────────────────
echo    TOTAL        : 122 phones
echo.

echo 📂 Deployment packages ready in:
echo    deployment\lulu\
echo    deployment\opti\
echo    deployment\mini\
echo    deployment\paso\
echo    deployment\dojang\
echo.

echo 🚀 NEXT STEPS:
echo ═══════════════════════════════════════════════════════
echo.
echo 1. Share C:\ADBTracker folder (completed above)
echo.
echo 2. Copy to each server:
echo    xcopy /E /I deployment\opti \\opti\c$\adb-tracker
echo    xcopy /E /I deployment\mini \\mini\c$\adb-tracker
echo    xcopy /E /I deployment\paso \\paso\c$\adb-tracker
echo    xcopy /E /I deployment\dojang \\dojang\c$\adb-tracker
echo.
echo 3. On each server, run:
echo    cd c:\adb-tracker
echo    deploy-{server}.bat
echo.
echo 4. Verify in Telegram:
echo    /servers   (should show all 5)
echo    /status    (should show all 122 phones)
echo    /notify    (enable notifications)
echo.

pause

echo.
echo Would you like to restart Lulu bot now with new config? (Y/N)
set /p RESTART=

if /i "%RESTART%"=="Y" (
    echo.
    echo 🔄 Restarting Lulu bot...
    npm start
)

echo.
echo ✅ DEPLOYMENT PREPARATION COMPLETE!
pause
