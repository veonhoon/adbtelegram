@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  ADB Tracker Bot - Multi-Server Setup
echo ========================================
echo.

REM Server IPs (Lulu is the main database server)
set LULU_IP=192.168.1.22
set OPTI_IP=192.168.1.30
set MINI_IP=192.168.1.171
set PASO_IP=192.168.1.118
set DOJANG_IP=192.168.1.194

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
    echo Installing PM2 globally...
    call npm install -g pm2
)

REM Check if ADB is available
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB is not available in PATH!
    echo Please ensure Android SDK Platform Tools are installed and in PATH
    pause
    exit /b 1
)

echo All prerequisites checked!
echo.

REM Prompt for server selection
echo Select server to configure:
echo.
echo   1. Lulu    (192.168.1.22)  - MAIN SERVER
echo   2. Opti    (192.168.1.30)
echo   3. Mini    (192.168.1.171)
echo   4. Paso    (192.168.1.118)
echo   5. Dojang  (192.168.1.194)
echo.
set /p server_choice="Enter choice (1-5): "

if "%server_choice%"=="1" (
    set SERVER_ID=lulu
    set IS_MAIN=1
)
if "%server_choice%"=="2" (
    set SERVER_ID=opti
    set IS_MAIN=0
)
if "%server_choice%"=="3" (
    set SERVER_ID=mini
    set IS_MAIN=0
)
if "%server_choice%"=="4" (
    set SERVER_ID=paso
    set IS_MAIN=0
)
if "%server_choice%"=="5" (
    set SERVER_ID=dojang
    set IS_MAIN=0
)

if not defined SERVER_ID (
    echo Invalid choice! Please run again.
    pause
    exit /b 1
)

echo.
echo Selected: %SERVER_ID%
echo.

REM Set database path based on server
if "%IS_MAIN%"=="1" (
    echo This is the MAIN server - using local database
    set DB_PATH=C:/ADBTracker/adb_tracker.db

    REM Create folder if needed
    if not exist "C:\ADBTracker" mkdir "C:\ADBTracker"

    REM Copy existing db if exists and target doesn't
    if exist "adb_tracker.db" (
        if not exist "C:\ADBTracker\adb_tracker.db" (
            copy adb_tracker.db "C:\ADBTracker\adb_tracker.db"
        )
    )
) else (
    echo This is an AGENT server - connecting to Lulu's database
    set DB_PATH=\\%LULU_IP%\ADBTracker\adb_tracker.db

    echo.
    echo Testing connection to Lulu's database...
    if exist "\\%LULU_IP%\ADBTracker\adb_tracker.db" (
        echo ✓ Successfully connected to shared database!
    ) else (
        echo.
        echo ⚠ WARNING: Cannot access \\%LULU_IP%\ADBTracker\adb_tracker.db
        echo.
        echo Please ensure on Lulu server:
        echo   1. Folder C:\ADBTracker exists
        echo   2. Folder is shared as "ADBTracker" with read/write access
        echo   3. The database file exists in that folder
        echo.
        echo To share the folder on Lulu:
        echo   1. Right-click C:\ADBTracker
        echo   2. Properties ^> Sharing ^> Share
        echo   3. Add "Everyone" with Read/Write permissions
        echo.
        set /p continue="Press Enter to continue anyway or Ctrl+C to exit..."
    )
)

REM Create .env file
echo.
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
echo DB_PATH=%DB_PATH%
echo.
echo # Mode
echo MODE=standalone
) > .env

echo ✓ .env created!
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo ✓ Dependencies installed!
echo.

REM Build TypeScript
echo Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✓ Build complete!
echo.

REM Run device detection and setup
echo Detecting connected ADB devices...
node detect-and-rename.js %SERVER_ID%
echo.

REM Initialize expected devices in database
echo Initializing expected devices...
node initialize-expected-devices.js 2>nul
echo.

REM Rename detected devices
echo Renaming devices...
node rename-devices.js 2>nul
echo.

REM Stop existing bot
echo Stopping any existing bot...
pm2 delete telegrambot 2>nul
echo.

REM Start bot with PM2
echo Starting Telegram bot...
pm2 start dist/index.js --name "telegrambot"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start bot!
    pause
    exit /b 1
)

REM Save PM2 config
pm2 save
echo.

echo ========================================
echo  ✅ Setup Complete for %SERVER_ID%!
echo ========================================
echo.
echo Database: %DB_PATH%
echo.
echo PM2 Commands:
echo   pm2 list              - View status
echo   pm2 logs telegrambot  - View logs
echo   pm2 restart telegrambot - Restart
echo.
echo Telegram Commands:
echo   /status              - All servers status
echo   /%SERVER_ID% adb devices - Run command on this server
echo   /mute %SERVER_ID%    - Mute phones on this server
echo.
pause
