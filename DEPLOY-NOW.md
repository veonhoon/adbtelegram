# 🚀 ONE-CLICK DEPLOYMENT GUIDE

## ✅ Everything is READY!

Your ADB Tracker Bot is ready to deploy across all 5 servers with **one-click setup scripts**.

---

## 📋 DEPLOYMENT STEPS

### 1️⃣ Push to GitHub (Do this FIRST)

```bash
cd "c:\New folder"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/adb-tracker-bot.git

# Push all code
git push -u origin main
```

---

### 2️⃣ Deploy to Each Server

**On each server (Opti, Mini, Paso, Dojang):**

```bash
# Clone from GitHub
cd c:\
git clone https://github.com/YOUR_USERNAME/adb-tracker-bot.git
cd adb-tracker-bot

# Install dependencies
npm install

# Build project
npm run build

# Run the one-click setup script
SETUP-OPTI.bat     # On Opti server
SETUP-MINI.bat     # On Mini server
SETUP-PASO.bat     # On Paso server
SETUP-DOJANG.bat   # On Dojang server
```

**That's it!** Each script does EVERYTHING automatically:
- ✅ Copies server-specific configuration
- ✅ Tests database connection to Lulu
- ✅ Initializes all expected phones (even offline ones)
- ✅ Renames connected devices
- ✅ Starts PM2 process
- ✅ Saves PM2 configuration

---

## 📱 What Each Script Does

### SETUP-OPTI.bat
- Configures for **29 phones**
- Connects to Lulu database
- Starts `adb-opti` PM2 process

### SETUP-MINI.bat
- Configures for **19 phones**
- Connects to Lulu database
- Starts `adb-mini` PM2 process

### SETUP-PASO.bat
- Configures for **24 phones**
- Connects to Lulu database
- Starts `adb-paso` PM2 process

### SETUP-DOJANG.bat
- Configures for **13 phones**
- Connects to Lulu database
- Starts `adb-dojang` PM2 process

---

## 🔍 Verify After Each Deployment

### In Telegram:
```
/servers    - Should show new server
/status     - Should show all phones with correct counts
```

### On Server:
```cmd
pm2 list              - Should show running process
pm2 logs adb-{server} - Should show regular 30s checks
```

---

## 📊 Expected Results

After deploying ALL servers:

### /servers command:
```
🟢 Lulu (31 devices)
🟢 Opti (29 devices)
🟢 Mini (19 devices)
🟢 Paso (24 devices)
🟢 Dojang (13 devices)
```

### /status command:
```
📊 Device Status Overview

🟢 Lulu (27/31 online)
  Phone-1
  Phone-2
  ...

🟢 Opti (XX/29 online)
  Phone-5
  Phone-6
  ...

⚠️ Offline Devices (YY):
  Phone-50 - Lulu - offline
  Phone-76 - Lulu - offline
  ...

📈 Total: XX/116 online
```

---

## 🛠️ Troubleshooting

### Script fails on database connection:
```cmd
# On Lulu, share the folder:
1. Right-click C:\ADBTracker → Properties
2. Sharing → Advanced Sharing
3. Share name: ADBTracker
4. Permissions: Full Control

# Test from agent server:
dir \\lulu\ADBTracker
```

### PM2 fails to start:
```cmd
pm2 logs adb-{server}
# Check error messages
```

### Phones not showing correctly:
```cmd
# Re-run initialization
node initialize-expected-devices.js

# Re-run rename
node rename-devices.js

# Restart PM2
pm2 restart adb-{server}
```

---

## 🎯 Deployment Order

Deploy in this order to test as you go:

1. ✅ **Lulu** - Already running
2. 🔵 **Opti** - Deploy first (test agent setup)
3. 🔵 **Mini** - After Opti success
4. 🔵 **Paso** - After Mini
5. 🔵 **Dojang** - Last

---

## ⚡ Quick Commands Reference

```cmd
pm2 list                  # View all processes
pm2 logs adb-{server}     # View logs
pm2 restart adb-{server}  # Restart process
pm2 stop adb-{server}     # Stop process
pm2 save                  # Save PM2 config
```

---

## 🎉 You're Ready!

1. Create GitHub repo
2. Push code
3. Run `SETUP-{SERVER}.bat` on each server
4. Test in Telegram
5. Done! 🚀

**Total Time:** ~5 minutes per server
