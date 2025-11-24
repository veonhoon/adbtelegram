# 🚀 ADB Tracker - Complete Deployment Package

## ✅ What's Ready

You have everything you need to deploy across all 5 servers:

### 📦 Deployment Packages Created
- **lulu** (31 phones) - MAIN SERVER with Telegram bot
- **opti** (29 phones) - Agent
- **mini** (19 phones) - Agent
- **paso** (24 phones) - Agent
- **dojang** (13 phones) - Agent

**Total: 122 phones across 5 servers, managed by ONE Telegram bot**

---

## 🎯 Quick Start Guide

### 1. Prepare Deployment Packages (ON LULU)

```cmd
cd "c:\New folder"
prepare-deployments.bat
```

This copies all necessary files to each `deployment\{server}\` folder.

### 2. Share Database on Lulu

```cmd
REM Create folder
mkdir C:\ADBTracker

REM Copy current database
copy adb_tracker.db C:\ADBTracker\

REM Share the folder (do this manually in Windows Explorer)
REM Right-click C:\ADBTracker → Properties → Sharing → Advanced Sharing
REM Share name: ADBTracker
REM Permissions: Full Control for all servers
```

### 3. Update Lulu's .env

```env
DB_PATH=C:\ADBTracker\adb_tracker.db
```

### 4. Restart Lulu Bot

```cmd
npm start
```

### 5. Deploy to Each Server

#### For Opti:
```cmd
REM Copy deployment package
xcopy /E /I "c:\New folder\deployment\opti" "\\opti\c$\adb-tracker"

REM On opti server, run:
cd c:\adb-tracker
deploy-opti.bat
```

#### For Mini:
```cmd
xcopy /E /I "c:\New folder\deployment\mini" "\\mini\c$\adb-tracker"

REM On mini server:
cd c:\adb-tracker
deploy-mini.bat
```

#### For Paso:
```cmd
xcopy /E /I "c:\New folder\deployment\paso" "\\paso\c$\adb-tracker"

REM On paso server:
cd c:\adb-tracker
deploy-paso.bat
```

#### For Dojang:
```cmd
xcopy /E /I "c:\New folder\deployment\dojang" "\\dojang\c$\adb-tracker"

REM On dojang server:
cd c:\adb-tracker
deploy-dojang.bat
```

---

## 📱 What Each deploy-{server}.bat Does

1. ✓ Checks Node.js and ADB are installed
2. ✓ Installs dependencies (if needed)
3. ✓ Builds TypeScript (if needed)
4. ✓ **Automatically renames all devices** to Phone-1, Phone-2, etc.
5. ✓ Starts monitoring
6. ✓ Connects to lulu's shared database

**You don't need to manually rename anything!**

---

## ✅ Verification

### Check Telegram Bot

```
/servers
```
Expected output:
```
🟢 Lulu - 31 devices
🟢 Opti - 29 devices
🟢 Mini - 19 devices
🟢 Paso - 24 devices
🟢 Dojang - 13 devices
```

```
/status
```
Should show ALL 122 phones with names like:
```
🟢 Lulu
  🟢 Phone-1 - online
  🟢 Phone-2 - online
  ...

🟢 Opti
  🟢 Phone-5 - online
  🟢 Phone-6 - online
  ...
```

---

## 📂 File Structure

Each deployment folder contains:

```
deployment/{server}/
├── src/                    # Source code
├── dist/                   # Compiled JavaScript
├── node_modules/           # Dependencies
├── package.json
├── tsconfig.json
├── .env                    # Pre-configured for this server!
├── rename-devices.js       # Auto-rename script
├── deploy-{server}.bat     # One-click deployment
└── README.md               # Server-specific instructions
```

---

## 🔧 Configuration Details

### Lulu (.env)
```env
TELEGRAM_BOT_TOKEN=8580518121:AAHCWEa64fcl23PGUmQBzfOcuPpQ4FxQo7E
SERVER_ID=lulu
SERVER_NAME=Lulu
DB_PATH=C:\ADBTracker\adb_tracker.db
MODE=standalone  ← Runs BOT + MONITOR
```

### Other Servers (.env)
```env
SERVER_ID=opti  (or mini, paso, dojang)
SERVER_NAME=Opti
DB_PATH=\\lulu\ADBTracker\adb_tracker.db  ← Points to lulu!
MODE=agent  ← Monitor ONLY, no bot
```

---

## 🎯 Key Features

✅ **Centralized Management** - All phones in ONE Telegram bot
✅ **Auto-Discovery** - Detects connected devices automatically
✅ **Auto-Naming** - Devices renamed to Phone-1, Phone-2, etc.
✅ **Real-time Monitoring** - Checks every 30 seconds
✅ **Instant Alerts** - Telegram notifications when phones go down
✅ **Multi-Server Support** - 5 servers, 122 phones, ONE bot
✅ **Easy Updates** - Update code on lulu, copy to others

---

## 📞 Telegram Commands

```
/start       - Welcome message
/help        - Show all commands
/status      - View all 122 phones
/servers     - List all 5 servers
/devices {server} - Phones on specific server
/stats       - Overall statistics
/notify      - Enable notifications for this chat
/rename {serial} {server} {name} - Rename a device
```

---

## 🚨 Troubleshooting

### Can't access \\lulu\ADBTracker
- Check folder is shared
- Verify network connectivity: `ping lulu`
- Test access: `dir \\lulu\ADBTracker`

### Device not renamed
- Check device is connected: `adb devices`
- Run: `node rename-devices.js`
- Verify serial number matches

### Bot not responding
- Check bot is running on lulu
- Verify token in .env
- Send `/start` in Telegram

---

## 🎉 You're Done!

Once all servers are running, you have:
- ✅ 122 phones monitored 24/7
- ✅ ONE Telegram bot for everything
- ✅ Real-time status updates
- ✅ Instant offline alerts
- ✅ Easy management from lulu

**See DEPLOYMENT-INSTRUCTIONS.md for detailed step-by-step guide.**
