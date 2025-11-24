@echo off
echo ╔═══════════════════════════════════════╗
echo ║   Starting Lulu (Main Server) PM2     ║
echo ║   Bot + Monitor                        ║
echo ╚═══════════════════════════════════════╝
echo.

cd "%~dp0"

REM Stop existing process if any
pm2 delete adb-lulu 2>nul

REM Start with PM2
echo → Starting ADB Tracker Bot (Lulu)...
pm2 start npm --name "adb-lulu" -- start

REM Save PM2 config
pm2 save

echo.
echo ✅ Lulu bot started successfully!
echo.
echo 📊 Check status: pm2 list
echo 📝 View logs:   pm2 logs adb-lulu
echo 🔄 Restart:     pm2 restart adb-lulu
echo 🛑 Stop:        pm2 stop adb-lulu
echo.
pause
