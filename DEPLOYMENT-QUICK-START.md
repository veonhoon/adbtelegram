# 🚀 Quick Start Deployment Guide

## ✅ What You Have Now (on Lulu)

- Bot tracking **31/31 phones** (27 online, 4 offline)
- `/status` command working perfectly:
  - ✓ Phones sorted numerically
  - ✓ Count shown (27/31 online)
  - ✓ Offline devices listed separately
  - ✓ Overall summary at bottom

---

## 📋 Deployment Steps for Each Server

### On Each Agent Server (Opti, Mini, Paso, Dojang):

```bash
# 1. Clone from GitHub
cd c:\
git clone https://github.com/YOUR_USERNAME/adb-tracker-bot.git
cd adb-tracker-bot

# 2. Install & Build
npm install
npm run build

# 3. Copy server-specific files (replace {server} with opti, mini, paso, or dojang)
copy deployment\{server}\.env .
copy deployment\{server}\rename-devices.js .
copy start-pm2-agent.bat .

# 4. Initialize expected devices (IMPORTANT!)
node initialize-expected-devices.js

# 5. Rename connected devices
node rename-devices.js

# 6. Start with PM2
start-pm2-agent.bat

# 7. Verify
pm2 list
pm2 logs adb-{server}
```

---

## 🔑 Key Points

### The `initialize-expected-devices.js` Script

**What it does:**
- Reads `phone-mappings.json`
- Adds ALL expected phones to the database
- Phones that have never been connected show as "offline"
- This ensures accurate counts like "27/31 online"

**When to run it:**
- ✅ **BEFORE starting the bot** on each server
- ✅ After deploying to a new server
- ✅ Only affects the current server (reads SERVER_ID from .env)

**Example output:**
```
📱 OPTI: Checking 29 expected phones
  + Phone-5 added as offline (will update when connected)
  + Phone-6 added as offline (will update when connected)
  ...
  ✅ Added: 29 devices
```

---

## 📝 Deployment Order

1. ✅ **Lulu** - Already done and running
2. 🔵 **Opti** - Test deployment (29 phones)
3. 🔵 **Mini** - After Opti success (19 phones)
4. 🔵 **Paso** - After Mini (24 phones)
5. 🔵 **Dojang** - Last (13 phones)

---

## ✅ Success Verification

After deploying each server:

### In Telegram:
```
/servers
🟢 Lulu (31 devices)
🟢 Opti (29 devices)  <- Should appear after Opti deployment

/status
Should show ALL servers with counts and offline devices listed
```

### On Server:
```cmd
pm2 list
# Should show: adb-{server} | online | 0 | 1m

pm2 logs adb-{server}
# Should show regular 30s checks
```

---

## 🔄 Making Changes After Deployment

**This system is designed for continuous updates!**

### On Lulu (Master):
```cmd
# Edit code in src/
npm run build

# Test locally
pm2 restart adb-lulu

# Commit & push
git add .
git commit -m "Your changes"
git push
```

### On Agent Servers:
```cmd
git pull
npm run build
pm2 restart adb-{server}
```

---

## 🎯 Common Commands

```cmd
# View status
pm2 list

# View logs
pm2 logs adb-lulu

# Restart after changes
pm2 restart adb-lulu

# Stop
pm2 stop adb-lulu

# Save PM2 config
pm2 save
```

---

## ⚠️ Important Notes

1. **Always run `initialize-expected-devices.js` before starting the bot**
2. **Lulu must be running** before starting agents (they need database access)
3. **Share `C:\ADBTracker`** on Lulu before deploying agents
4. **Test with Opti first** before deploying to all servers

---

## 🎉 You're Ready!

- ✅ Code is committed to Git
- ✅ All expected devices initialized
- ✅ `/status` command works perfectly
- ✅ System supports continuous updates

**Next step:** Push to GitHub and deploy to Opti!
