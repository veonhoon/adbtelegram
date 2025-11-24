# ADB Tracker Multi-Server Deployment Instructions

## Overview
- **Total Phones**: 122 across 5 servers
- **ONE Telegram Bot** on lulu server manages everything
- **4 Agent servers** just monitor their phones

## Server Breakdown
- **lulu**: 31 phones (MAIN - Bot + Monitor)
- **opti**: 29 phones (Agent - Monitor only)
- **mini**: 19 phones (Agent - Monitor only)
- **paso**: 24 phones (Agent - Monitor only)
- **dojang**: 13 phones (Agent - Monitor only)

---

## STEP 1: Setup Lulu (Main Server) ✅ DONE

Lulu is already running! But we need to share the database:

### Share Database Folder

1. **Create shared folder:**
   ```
   C:\ADBTracker
   ```

2. **Share on network:**
   - Right-click `C:\ADBTracker` → Properties → Sharing → Advanced Sharing
   - Check "Share this folder"
   - Share name: `ADBTracker`
   - Permissions: Grant "Full Control" to Everyone (or specific server computers)
   - Click OK

3. **Test from lulu itself:**
   ```cmd
   dir \\lulu\ADBTracker
   ```
   Should show the adb_tracker.db file

4. **Move database to shared location:**
   - Stop the current bot (Ctrl+C)
   - Copy `adb_tracker.db` to `C:\ADBTracker\`
   - Update `.env` on lulu:
     ```
     DB_PATH=C:\ADBTracker\adb_tracker.db
     ```
   - Restart: `npm start`

---

## STEP 2: Deploy to Other Servers

### For Each Server (opti, mini, paso, dojang):

1. **Copy deployment package**
   - Go to `deployment/{server_name}/` folder
   - Copy EVERYTHING to the target server

2. **What to copy:**
   ```
   {server_name}/
   ├── src/            (all source code)
   ├── dist/           (compiled code)
   ├── node_modules/   (dependencies)
   ├── package.json
   ├── tsconfig.json
   ├── .env            (pre-configured!)
   ├── rename-devices.js
   ├── deploy-{server}.bat
   └── README.md
   ```

3. **On the target server:**
   - Open Command Prompt
   - Navigate to the copied folder
   - Run: `deploy-{server}.bat`

4. **The script will:**
   - ✓ Check Node.js and ADB
   - ✓ Install dependencies (if needed)
   - ✓ Build project (if needed)
   - ✓ Rename all devices automatically
   - ✓ Start monitoring
   - ✓ Connect to lulu's shared database

---

## STEP 3: Verify Everything Works

### On Lulu Server
After all agents are running, check Telegram:

```
/servers
```
Should show:
```
🟢 Lulu (31 devices)
🟢 Opti (29 devices)
🟢 Mini (19 devices)
🟢 Paso (24 devices)
🟢 Dojang (13 devices)
```

```
/status
```
Should show ALL 122 phones with their names!

---

## Quick Copy Script (FOR EACH SERVER)

### Copy to Opti:
```cmd
cd "c:\New folder"
xcopy /E /I deployment\opti \\opti\c$\adb-tracker
```

### Copy to Mini:
```cmd
xcopy /E /I deployment\mini \\mini\c$\adb-tracker
```

### Copy to Paso:
```cmd
xcopy /E /I deployment\paso \\paso\c$\adb-tracker
```

### Copy to Dojang:
```cmd
xcopy /E /I deployment\dojang \\dojang\c$\adb-tracker
```

Then on each server:
```cmd
cd c:\adb-tracker
deploy-{server}.bat
```

---

## Troubleshooting

### Agent can't connect to database
**Error:** "Cannot access \\\\lulu\\ADBTracker\\adb_tracker.db"

**Fix:**
1. Check lulu's share: `dir \\lulu\ADBTracker` from agent
2. Verify share permissions
3. Ping lulu: `ping lulu`
4. Check Windows Firewall

### Devices not showing in Telegram
**Problem:** Added devices but not in /status

**Fix:**
1. Check agent is running
2. Verify database path in .env
3. Check devices are plugged in: `adb devices`
4. Run rename script again: `node rename-devices.js`

### Bot not starting on lulu
**Problem:** Bot won't start after moving database

**Fix:**
1. Check .env has correct DB_PATH
2. Verify database file exists: `dir C:\ADBTracker\adb_tracker.db`
3. Check bot token is correct

---

## What Happens Next

Once all servers are running:

✅ **ONE Telegram bot** shows all 122 phones
✅ **Real-time monitoring** every 30 seconds
✅ **Instant notifications** when any phone goes down
✅ **All managed from lulu** - no need to touch other servers
✅ **Easy updates** - change code on lulu, copy to others

## Telegram Commands

```
/status              - See all 122 phones across all servers
/servers             - List all 5 servers
/devices lulu        - See phones on specific server
/stats               - Total counts
/notify              - Enable alerts in this chat
```

## Future Updates

To update the code:
1. Make changes on lulu
2. Run: `npm run build`
3. Copy `dist/` folder to other servers
4. Restart agents

---

**That's it! You now have a centralized phone farm monitoring system!** 🎉
