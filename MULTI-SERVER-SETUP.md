# Multi-Server Setup Guide

This guide shows you exactly how to deploy ADB Tracker Bot across multiple servers with ONE Telegram bot managing everything.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Telegram Bot                        │
│              (One bot for ALL servers)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Shared Database                            │
│              adb_tracker.db (SQLite)                         │
│         (Accessible by all servers)                          │
└─────┬──────────────┬──────────────┬─────────────────────────┘
      │              │              │
      │              │              │
┌─────▼──────┐ ┌────▼──────┐ ┌─────▼──────┐
│ Server 1   │ │ Server 2  │ │ Server 3   │
│ (Main)     │ │ (Agent)   │ │ (Agent)    │
│            │ │           │ │            │
│ • Monitor  │ │ • Monitor │ │ • Monitor  │
│ • Bot      │ │ only      │ │ only       │
│            │ │           │ │            │
│ Devices:   │ │ Devices:  │ │ Devices:   │
│ [A][B][C]  │ │ [D][E]    │ │ [F][G][H]  │
└────────────┘ └───────────┘ └────────────┘
```

**Key Point:** All servers access the SAME database file. The bot on Server 1 sees ALL devices from ALL servers.

## Step-by-Step Setup

### Step 1: Set Up File Sharing (Windows)

On **Server 1** (Main Server):

1. Create a shared folder:
   ```
   C:\ADBTracker\
   ```

2. Share this folder on the network:
   - Right-click folder → Properties → Sharing → Advanced Sharing
   - Check "Share this folder"
   - Share name: `ADBTracker`
   - Permissions: Grant Full Control to all server computers
   - Click OK

3. Note the network path:
   ```
   \\Server1\ADBTracker
   ```

### Step 2: Install on Server 1 (Main Server)

1. Copy the `adb-tracker-bot` folder to Server 1

2. Create `.env` file:
   ```env
   # Telegram Configuration
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_ADMIN_CHAT_ID=123456789

   # Server 1 Configuration
   SERVER_ID=server-1
   SERVER_NAME=Rack 1 - Main

   # Monitoring
   CHECK_INTERVAL_SECONDS=30

   # Database - Use local path since this is the main server
   DB_PATH=C:\ADBTracker\adb_tracker.db

   # Run in standalone mode (monitor + bot)
   MODE=standalone
   ```

3. Run setup:
   ```cmd
   cd adb-tracker-bot
   scripts\setup.bat
   ```

4. Start the bot:
   ```cmd
   npm start
   ```

5. Verify it's working:
   - Open Telegram
   - Find your bot
   - Send `/start`
   - Send `/status` - should show Server 1 devices

### Step 3: Install on Server 2 (Agent)

1. Copy the `adb-tracker-bot` folder to Server 2

2. Create `.env` file:
   ```env
   # NO Telegram token needed for agent!

   # Server 2 Configuration
   SERVER_ID=server-2
   SERVER_NAME=Rack 2 - Secondary

   # Monitoring
   CHECK_INTERVAL_SECONDS=30

   # Database - Point to Server 1's shared database
   DB_PATH=\\Server1\ADBTracker\adb_tracker.db

   # Run in agent mode (monitor only, no bot)
   MODE=agent
   ```

3. Run setup:
   ```cmd
   cd adb-tracker-bot
   scripts\setup.bat
   ```

4. Start the monitor:
   ```cmd
   npm start
   ```

5. Verify it's working:
   - Check console output shows "agent mode"
   - In Telegram, send `/servers` - should now show 2 servers!
   - Send `/status` - should show devices from BOTH servers!

### Step 4: Install on Server 3, 4, 5... (More Agents)

Repeat Step 3 for each additional server, changing only:

```env
SERVER_ID=server-3  # Unique ID for each server
SERVER_NAME=Rack 3 - Floor 2  # Descriptive name

# Everything else stays the same!
DB_PATH=\\Server1\ADBTracker\adb_tracker.db
MODE=agent
```

## Configuration Summary

### Server 1 (Main) - `.env`
```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
SERVER_ID=server-1
SERVER_NAME=Rack 1 - Main
CHECK_INTERVAL_SECONDS=30
DB_PATH=C:\ADBTracker\adb_tracker.db
MODE=standalone
```

### Server 2+ (Agents) - `.env`
```env
# NO TELEGRAM_BOT_TOKEN!
SERVER_ID=server-2  # Change for each server!
SERVER_NAME=Rack 2  # Change for each server!
CHECK_INTERVAL_SECONDS=30
DB_PATH=\\Server1\ADBTracker\adb_tracker.db  # Same for all!
MODE=agent
```

## Verification Checklist

After setup, verify everything works:

- [ ] Server 1 shows: "Starting in standalone mode"
- [ ] Server 2+ show: "Running in agent mode"
- [ ] All servers show: Same database path
- [ ] Telegram `/servers` shows ALL servers
- [ ] Telegram `/status` shows devices from ALL servers
- [ ] Unplug a device on Server 2 → Get notification
- [ ] `/add` and `/remove` commands work
- [ ] All servers restart successfully

## How It Works

1. **Server 1** (Main):
   - Runs the device monitor (checks devices every 30s)
   - Runs the Telegram bot (handles your commands)
   - Stores database locally at `C:\ADBTracker\adb_tracker.db`
   - Shares this database via network

2. **Server 2, 3, 4...** (Agents):
   - Run device monitors only (no Telegram bot)
   - Access the shared database via `\\Server1\ADBTracker\adb_tracker.db`
   - Write device status to the shared database
   - Server 1's bot sees these changes and sends notifications

3. **The Telegram Bot** (only on Server 1):
   - Polls the database for changes every 5 seconds
   - When any device changes status (on ANY server)
   - Sends you a notification
   - Shows all servers/devices when you type `/status`

## Adding Devices

### Option 1: Automatic Discovery (Easiest)

1. Connect devices to a server
2. Restart that server's ADB Tracker
3. It will auto-detect and add them

### Option 2: Manual via Telegram

```
# Find the device serial first (on the server)
adb devices

# Then add via Telegram
/add ABC123 server-2
```

## Managing Devices

### View all devices
```
/status
```

### View devices on specific server
```
/devices server-2
```

### Add device
```
/add <serial> <server-id>
/add ABC123 server-1
```

### Remove device
```
/remove <serial> <server-id>
/remove ABC123 server-1
```

### List all servers
```
/servers
```

### Enable notifications
```
/notify
```

## Moving Devices Between Servers

When you physically move a device from Server 1 to Server 2:

1. Unplug from Server 1, plug into Server 2
2. In Telegram:
   ```
   /remove ABC123 server-1
   /add ABC123 server-2
   ```

Or just restart Server 2's tracker - it will auto-discover new devices!

## Troubleshooting

### "Cannot access database file"

**Problem:** Agent can't access `\\Server1\ADBTracker\adb_tracker.db`

**Fix:**
1. Verify Server 1 is online
2. Check network path: `dir \\Server1\ADBTracker`
3. Verify share permissions (Full Control)
4. Ping Server 1 from agent: `ping Server1`

### "Database is locked"

**Problem:** Multiple processes trying to write simultaneously

**Fix:** This is normal with SQLite over network. The system handles it automatically with retries. If persists:
1. Check only ONE server runs in `standalone` mode
2. All others run in `agent` mode
3. Reduce `CHECK_INTERVAL_SECONDS` if needed

### Devices not showing in Telegram

**Problem:** Added device but not visible in `/status`

**Fix:**
1. Verify device is connected: `adb devices` on that server
2. Check server ID matches: `/servers` in Telegram
3. Try: `/devices server-id` to see if it's tracked
4. Restart the monitor on that server

### Bot doesn't start on Server 1

**Problem:** Server 1 won't start

**Fix:**
1. Verify `TELEGRAM_BOT_TOKEN` in `.env`
2. Check `MODE=standalone`
3. Verify database path exists: `C:\ADBTracker\`
4. Check console for error messages

### Agent can't start

**Problem:** Server 2+ won't start

**Fix:**
1. Verify `MODE=agent` (not standalone!)
2. Check database path: `DB_PATH=\\Server1\ADBTracker\adb_tracker.db`
3. Test network access: `dir \\Server1\ADBTracker`
4. Verify Server 1 is running and sharing the folder

## Running as Windows Service

To run automatically on server startup:

1. Install node-windows:
   ```cmd
   npm install -g node-windows
   ```

2. Create `install-service.js` on each server:
   ```javascript
   const Service = require('node-windows').Service;

   const svc = new Service({
     name: 'ADB Tracker',
     description: 'ADB Device Monitor',
     script: 'C:\\path\\to\\adb-tracker-bot\\dist\\index.js',
     nodeOptions: []
   });

   svc.on('install', () => svc.start());
   svc.install();
   ```

3. Run:
   ```cmd
   node install-service.js
   ```

## Performance Considerations

- **Recommended Setup:**
  - Up to 10 servers: Works perfectly
  - Up to 100 devices per server: No issues
  - Check interval: 30 seconds (good balance)

- **Network Requirements:**
  - Minimal bandwidth (only database writes)
  - Reliable network connection between servers
  - Low latency preferred but not critical

## Security Notes

- Database file contains device info (serials, status)
- Protect the share folder (restrict access to server computers only)
- Keep `.env` files secure (contain bot token)
- Don't expose Server 1 to internet unless properly secured

## Quick Reference

### Server 1 Commands
```cmd
# Start everything (bot + monitor)
npm start

# View logs
# (Shows in console)

# Stop
Ctrl+C
```

### Server 2+ Commands
```cmd
# Start monitor only
npm start

# View logs
# (Shows in console)

# Stop
Ctrl+C
```

### Telegram Commands
```
/start - Welcome
/status - View all devices
/servers - List servers
/devices server-id - Devices on server
/add serial server-id - Add device
/remove serial server-id - Remove device
/stats - Statistics
/notify - Enable notifications
/help - All commands
```

## Success Criteria

Your setup is working correctly when:

✅ One Telegram bot shows devices from ALL servers
✅ Unplugging device on ANY server sends notification
✅ `/status` shows all devices with correct server names
✅ `/servers` lists all your servers
✅ Can add/remove devices via Telegram
✅ All servers restart without errors
✅ Database file accessible from all servers

## Next Steps

Once everything is running:

1. **Test thoroughly** - Unplug devices, check notifications
2. **Set up as service** - So it runs on startup
3. **Document your setup** - Note which devices are where
4. **Add to group chat** - Let your team see status too
5. **Set up backups** - Backup `C:\ADBTracker\adb_tracker.db` daily

You now have a complete multi-server ADB tracking system! 🎉
