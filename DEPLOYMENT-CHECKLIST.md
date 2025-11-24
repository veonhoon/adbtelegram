# Deployment Checklist

Use this checklist to verify your ADB Tracker Bot is ready for production.

## ✅ Pre-Deployment Verification

### Prerequisites Installed
- [ ] Node.js 18+ installed on all servers
- [ ] ADB (Android Platform Tools) installed on all servers
- [ ] ADB is in PATH (`adb version` works from command line)
- [ ] npm is working (`npm --version`)
- [ ] Telegram bot created via @BotFather
- [ ] Bot token saved securely
- [ ] Chat ID obtained from @userinfobot

### Network Setup (Multi-Server Only)
- [ ] Main server has shared folder created
- [ ] Shared folder permissions set correctly
- [ ] All servers can access shared folder
- [ ] Tested network path from each server (`dir \\Server1\ADBTracker`)

### Code Installation
- [ ] Code copied to all servers
- [ ] `npm install` completed successfully on all servers
- [ ] `npm run build` completed successfully on all servers
- [ ] No compilation errors

## ✅ Configuration Verification

### Main Server (Server 1) - `.env`
- [ ] `TELEGRAM_BOT_TOKEN` is set correctly
- [ ] `TELEGRAM_ADMIN_CHAT_ID` is set correctly
- [ ] `SERVER_ID` is unique (e.g., `server-1`)
- [ ] `SERVER_NAME` is descriptive (e.g., `Rack 1 - Main`)
- [ ] `CHECK_INTERVAL_SECONDS` is set (30 recommended)
- [ ] `DB_PATH` points to local or shared location
- [ ] `MODE=standalone`

### Agent Servers (Server 2+) - `.env`
- [ ] `TELEGRAM_BOT_TOKEN` is NOT set (agents don't need it)
- [ ] `SERVER_ID` is unique for each server
- [ ] `SERVER_NAME` is descriptive for each server
- [ ] `CHECK_INTERVAL_SECONDS` is set
- [ ] `DB_PATH` points to main server's shared database
- [ ] `MODE=agent`

## ✅ Device Setup

### Physical Connections
- [ ] Android devices connected via USB to servers
- [ ] USB debugging enabled on all devices
- [ ] USB debugging authorization accepted on all devices
- [ ] Devices show in `adb devices` with status "device"
- [ ] No devices show as "unauthorized"

### Device Discovery
- [ ] Main server discovers devices on startup
- [ ] Agent servers discover devices on startup
- [ ] Device serials are readable (not random chars)
- [ ] Device count matches physical devices

## ✅ Functionality Tests

### Main Server
- [ ] Starts without errors: `npm start`
- [ ] Shows "Starting in standalone mode"
- [ ] Shows correct database path
- [ ] Discovers connected devices
- [ ] Adds devices to tracking automatically
- [ ] Telegram bot starts successfully
- [ ] Shows "System fully operational"

### Agent Servers
- [ ] Start without errors: `npm start`
- [ ] Show "Running in agent mode"
- [ ] Show correct database path (network path)
- [ ] Discover connected devices
- [ ] Add devices to tracking
- [ ] No errors accessing shared database

### Telegram Bot
- [ ] Bot responds to `/start`
- [ ] `/help` shows all commands
- [ ] `/status` shows devices from ALL servers
- [ ] `/servers` lists all servers correctly
- [ ] `/devices server-id` works for each server
- [ ] `/stats` shows correct totals
- [ ] `/notify` enables notifications

### Device Management
- [ ] `/add serial server-id` adds device successfully
- [ ] Added device appears in `/status`
- [ ] `/remove serial server-id` removes device
- [ ] Removed device disappears from `/status`

### Monitoring & Notifications
- [ ] Unplug device → notification received within 1 minute
- [ ] Replug device → notification received
- [ ] Notification shows correct server name
- [ ] Notification shows correct device serial
- [ ] Notification shows status change (online → offline)
- [ ] Status change appears in `/status`

### Multi-Server Tests (If Applicable)
- [ ] Devices on Server 1 visible in Telegram
- [ ] Devices on Server 2 visible in Telegram
- [ ] Devices on Server 3+ visible in Telegram
- [ ] `/servers` shows all servers
- [ ] Unplug device on Server 2 → notification works
- [ ] Can add device to any server via Telegram
- [ ] Can remove device from any server via Telegram

## ✅ Stability Tests

### Restart Tests
- [ ] Main server restarts cleanly (Ctrl+C, then `npm start`)
- [ ] Agent servers restart cleanly
- [ ] Devices remembered after restart
- [ ] Telegram bot reconnects after restart
- [ ] No data loss after restart

### Error Handling
- [ ] Handles device disconnection gracefully
- [ ] Handles unauthorized device correctly
- [ ] Handles network interruption (multi-server)
- [ ] Handles database lock gracefully
- [ ] Shows meaningful error messages

### Long-Running Test
- [ ] Run for 1 hour without crashes
- [ ] Run for 24 hours without issues
- [ ] Memory usage stable (no leaks)
- [ ] CPU usage reasonable (<5% idle)

## ✅ Production Readiness

### Security
- [ ] `.env` files not committed to git
- [ ] `.env` files have restricted permissions
- [ ] Database file has restricted permissions (multi-server)
- [ ] Shared folder has restricted permissions (multi-server)
- [ ] Bot token stored securely
- [ ] No credentials in code or logs

### Monitoring
- [ ] Bot sends test notification successfully
- [ ] Notifications received on mobile
- [ ] Notifications work in group chats (if used)
- [ ] Know how to check if bot is running
- [ ] Know how to check logs
- [ ] Know how to restart if needed

### Documentation
- [ ] Server locations documented
- [ ] Device serial numbers documented
- [ ] .env configuration documented
- [ ] Team members know how to use Telegram commands
- [ ] Emergency contacts documented
- [ ] Backup procedure documented

### Backup & Recovery
- [ ] Database backup script created
- [ ] Backup location identified
- [ ] Test restore from backup successful
- [ ] .env files backed up securely
- [ ] Recovery procedure documented and tested

### Service Setup (Recommended)
- [ ] Bot runs as Windows service OR
- [ ] Bot runs as Linux systemd service OR
- [ ] Bot runs via PM2 OR
- [ ] Bot runs in screen/tmux session
- [ ] Service starts on system boot
- [ ] Service restarts on failure

## ✅ Performance Verification

### Response Times
- [ ] `/status` responds within 2 seconds
- [ ] Device status updates within check interval
- [ ] Notifications arrive within 1 minute of change
- [ ] Commands execute without delays

### Resource Usage
- [ ] CPU usage under 5% during normal operation
- [ ] Memory usage under 100MB per instance
- [ ] Database size reasonable (<10MB for 100 devices)
- [ ] Network traffic minimal (multi-server)

### Capacity
- [ ] System handles all connected devices
- [ ] No performance degradation with full load
- [ ] Can add more devices without issues
- [ ] Can add more servers without issues

## ✅ User Training

### Team Onboarding
- [ ] Team members added to Telegram bot
- [ ] Team knows how to check device status
- [ ] Team knows how to add devices
- [ ] Team knows how to remove devices
- [ ] Team knows how to enable notifications
- [ ] Team knows who to contact for issues

### Documentation Shared
- [ ] QUICK-START.md shared with team
- [ ] MULTI-SERVER-SETUP.md shared (if applicable)
- [ ] Telegram commands reference shared
- [ ] Emergency procedures shared

## ✅ Final Verification

### Critical Functions
- [ ] ONE Telegram bot manages ALL servers ✓
- [ ] Device status visible across all servers ✓
- [ ] Notifications work for all servers ✓
- [ ] Can add/remove devices remotely ✓
- [ ] System is stable and reliable ✓

### Sign-Off
- [ ] All critical tests passed
- [ ] All major features working
- [ ] Team is trained
- [ ] Documentation complete
- [ ] Ready for production use

## Deployment Modes

### Single Server (Standalone)
Required checks: Prerequisites, Main Server Config, Basic Functionality

### Multi-Server Setup
Required checks: All of the above + Network Setup + Multi-Server Tests

## Troubleshooting Reference

If any check fails, refer to:

- **Installation issues** → [QUICK-START.md](QUICK-START.md)
- **Multi-server setup** → [MULTI-SERVER-SETUP.md](MULTI-SERVER-SETUP.md)
- **Configuration problems** → [README.md](README.md)
- **Advanced features** → [ADVANCED-USAGE.md](ADVANCED-USAGE.md)
- **Production deployment** → [DEPLOYMENT.md](DEPLOYMENT.md)

## Success Criteria

✅ **You're ready to deploy when:**

1. All servers start without errors
2. Telegram bot responds to all commands
3. Devices visible from all servers
4. Notifications working reliably
5. System stable for 24+ hours
6. Team trained and documentation complete

## Post-Deployment

After successful deployment:

- [ ] Monitor for first 48 hours closely
- [ ] Verify backup jobs running
- [ ] Check for any error patterns in logs
- [ ] Get team feedback on usability
- [ ] Plan any needed improvements
- [ ] Schedule regular maintenance checks

---

**Date Deployed:** _______________

**Deployed By:** _______________

**Servers:** _______________

**Total Devices:** _______________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
