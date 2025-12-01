@echo off
REM Start ADB Tracker Bot with PM2

cd "%~dp0"

echo Stopping any existing bot...
pm2 delete telegrambot 2>nul

echo Starting Telegram Bot...
pm2 start dist/index.js --name "telegrambot"

echo Saving PM2 configuration...
pm2 save

echo.
echo ✅ Bot started!
echo.
echo Commands:
echo   pm2 list              - View status
echo   pm2 logs telegrambot  - View logs
echo   pm2 restart telegrambot - Restart
echo   pm2 stop telegrambot  - Stop
echo.
pause
