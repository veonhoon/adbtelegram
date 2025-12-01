@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  ADB Tracker Bot - Multi-Server Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PM2 is not installed!
    echo Please install PM2 globally: npm install -g pm2
    pause
    exit /b 1
)

REM Check if ADB is available
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB is not available in PATH!
    echo Please ensure Android SDK Platform Tools are installed and in PATH
    pause
    exit /b 1
)

echo All prerequisites checked successfully!
echo.

REM Prompt for server selection
echo Select server to configure:
echo 1. Lulu
echo 2. Opti
echo 3. Mini
echo 4. Paso
echo 5. Dojang
echo.
set /p server_choice="Enter choice (1-5): "

if "%server_choice%"=="1" set SERVER_ID=lulu
if "%server_choice%"=="2" set SERVER_ID=opti
if "%server_choice%"=="3" set SERVER_ID=mini
if "%server_choice%"=="4" set SERVER_ID=paso
if "%server_choice%"=="5" set SERVER_ID=dojang

if not defined SERVER_ID (
    echo Invalid choice! Please run the script again.
    pause
    exit /b 1
)

echo.
echo Selected server: %SERVER_ID%
echo.

REM Create .env file
echo Creating .env configuration...
(
echo # Telegram Bot Configuration
echo TELEGRAM_BOT_TOKEN=8580518121:AAHCWEa64fcl23PGUmQBzfOcuPpQ4FxQo7E
echo TELEGRAM_ADMIN_CHAT_ID=
echo.
echo # Server Configuration
echo SERVER_ID=%SERVER_ID%
echo SERVER_NAME=%SERVER_ID%
echo SERVER_HEALTH_URL=http://localhost:8000
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

echo ✓ .env file created successfully!
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo ✓ Dependencies installed!
echo.

REM Build TypeScript
echo Building TypeScript code...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build TypeScript!
    pause
    exit /b 1
)
echo ✓ TypeScript built successfully!
echo.

REM Detect and create rename script
echo Detecting connected ADB devices...
node detect-and-rename.js %SERVER_ID%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to detect devices!
    pause
    exit /b 1
)
echo.

REM Initialize database with expected devices
echo Initializing database with expected devices...
node initialize-expected-devices.js
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to initialize expected devices
)
echo.

REM Rename connected devices
echo Renaming connected devices...
node rename-devices.js
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to rename devices
)
echo.

REM Stop any existing bot
echo Stopping any existing bot...
pm2 delete telegrambot 2>nul
echo.

REM Start bot with PM2
echo Starting Telegram bot with PM2...
pm2 start dist/index.js --name "telegrambot"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start bot with PM2!
    pause
    exit /b 1
)
echo.

REM Save PM2 configuration
echo Saving PM2 configuration...
pm2 save
echo.

echo ========================================
echo  ✅ Setup Complete for %SERVER_ID%!
echo ========================================
echo.
echo The bot is now running and monitoring devices.
echo.
echo Useful PM2 commands:
echo   pm2 list              - View bot status
echo   pm2 logs telegrambot  - View bot logs
echo   pm2 restart telegrambot - Restart the bot
echo   pm2 stop telegrambot  - Stop the bot
echo.
echo Telegram commands:
echo   /status - View all devices across all servers
echo   /%SERVER_ID% adb devices - Run commands on this server
echo   /mute %SERVER_ID% - Mute all phones on this server
echo.
pause
