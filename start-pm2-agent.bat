@echo off
REM Universal PM2 startup script for agent servers
REM Detects server name from .env file

echo ╔═══════════════════════════════════════╗
echo ║   Starting ADB Tracker Agent PM2      ║
echo ║   Monitor Only                         ║
echo ╚═══════════════════════════════════════╝
echo.

cd "%~dp0"

REM Read SERVER_ID from .env
for /f "tokens=2 delims==" %%a in ('findstr /r "^SERVER_ID=" .env') do set SERVER_ID=%%a

if "%SERVER_ID%"=="" (
    echo ❌ Error: Could not find SERVER_ID in .env
    pause
    exit /b 1
)

echo Server ID: %SERVER_ID%
echo.

REM Stop existing process if any
pm2 delete adb-%SERVER_ID% 2>nul

REM Start with PM2
echo → Starting ADB Tracker Agent (%SERVER_ID%)...
pm2 start npm --name "adb-%SERVER_ID%" -- start

REM Save PM2 config
pm2 save

echo.
echo ✅ Agent %SERVER_ID% started successfully!
echo.
echo 📊 Check status: pm2 list
echo 📝 View logs:   pm2 logs adb-%SERVER_ID%
echo 🔄 Restart:     pm2 restart adb-%SERVER_ID%
echo 🛑 Stop:        pm2 stop adb-%SERVER_ID%
echo.
pause
