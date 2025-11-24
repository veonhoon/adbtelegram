# Getting Started with ADB Tracker Bot

Welcome! This guide will help you understand and use your new ADB tracking system.

## What is This?

ADB Tracker Bot is a **phone farm monitoring system** that:

- 📱 Tracks the status of all your ADB-connected Android devices
- 🔔 Sends Telegram notifications when devices go offline or become unauthorized
- 🌐 Supports multiple servers (track devices across different locations)
- 📊 Provides real-time status via Telegram commands
- 🔧 Easy to deploy and manage

## Quick Navigation

**New to the project?**
- Start here: [QUICK-START.md](QUICK-START.md) - Get running in 5 minutes

**Setting up production?**
- Read: [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide

**Want to customize?**
- Explore: [ADVANCED-USAGE.md](ADVANCED-USAGE.md) - Advanced features

**Understanding the code?**
- Review: [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) - Complete code overview

**Main documentation:**
- See: [README.md](README.md) - Full feature documentation

## Typical Use Case

You have a phone farm with multiple Android devices:

```
Rack 1 (Server 1)
├── Samsung Galaxy S21 - Online ✓
├── Pixel 6 - Online ✓
└── OnePlus 9 - Offline ✗  ← You get notified!

Rack 2 (Server 2)
├── iPhone 12 - Offline ✗   ← You get notified!
├── Galaxy S22 - Unauthorized ⚠️  ← You get notified!
└── Pixel 7 - Online ✓
```

**Instead of checking manually**, the bot:
1. Continuously monitors all devices
2. Detects status changes instantly
3. Sends you Telegram notifications
4. Lets you check status anytime with `/status`

## Core Concepts

### Servers

A **server** is a physical machine with devices connected via USB.

- Each server has a unique `SERVER_ID` (e.g., "rack-1", "rack-2")
- Each server runs a monitoring process
- All servers can be tracked by one Telegram bot

### Devices

A **device** is an Android device connected via ADB.

- Identified by **serial number** (from `adb devices`)
- Tracked status: online, offline, unauthorized, unknown
- Can be moved between servers

### Status States

| State | Meaning | Icon |
|-------|---------|------|
| **online** | Device connected and authorized | 🟢 |
| **offline** | Device not connected | 🔴 |
| **unauthorized** | Device connected but USB debugging not authorized | ⚠️ |
| **unknown** | Status not yet determined | ⚪ |

### Monitoring Modes

**Standalone Mode:**
- One server runs both monitor and Telegram bot
- Best for single-server setups
- Simplest to set up

**Agent Mode:**
- Multiple servers run monitors
- One server runs the Telegram bot
- All share a database
- Best for multi-server setups

## Workflow

### Initial Setup

1. **Install prerequisites** (Node.js, ADB)
2. **Create Telegram bot** (via @BotFather)
3. **Configure .env** file with your tokens
4. **Run setup script** or `npm install`
5. **Start the bot** with `npm start`

### First Run

When you first start, the system will:

1. Scan for connected ADB devices
2. Show you what it found
3. Ask if you want to track them
4. Begin monitoring

### Daily Usage

**Check status:**
```
You: /status
Bot: Shows all devices across all servers with current status
```

**Add a new device:**
```
1. Connect device via USB
2. Enable USB debugging
You: /add ABC123 server-1
Bot: ✓ Added device ABC123 to Main Server
```

**Get notified:**
```
# Device goes offline
Bot: 🔴 Device Status Changed
     Server: Main Server
     Device: ABC123
     Status: online → offline
```

### Moving Devices

When you physically move a device to another server:

```
# Remove from old location
You: /remove ABC123 server-1

# Add to new location
You: /add ABC123 server-2
```

## File Overview

Here's what each file does:

### Configuration
- **`.env`** - Your settings (bot token, server name, etc.)
- **`.env.example`** - Template for .env

### Documentation
- **`README.md`** - Complete feature documentation
- **`QUICK-START.md`** - 5-minute setup guide
- **`DEPLOYMENT.md`** - Production deployment
- **`ADVANCED-USAGE.md`** - Customization and advanced features
- **`PROJECT-STRUCTURE.md`** - Code structure and architecture
- **`GETTING-STARTED.md`** - This file

### Source Code
- **`src/database.ts`** - SQLite database management
- **`src/adb-monitor.ts`** - ADB device detection
- **`src/monitor.ts`** - Monitoring service
- **`src/telegram-bot.ts`** - Telegram bot
- **`src/index.ts`** - Main entry point

### Scripts
- **`scripts/setup.sh`** - Linux/Mac setup script
- **`scripts/setup.bat`** - Windows setup script

### Dependencies
- **`package.json`** - Node.js dependencies
- **`tsconfig.json`** - TypeScript configuration

## Common Tasks

### Starting the Bot

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

### Checking Logs

The bot outputs to console. In production, use:

```bash
# With systemd
sudo journalctl -u adb-tracker -f

# With PM2
pm2 logs adb-tracker
```

### Backing Up

```bash
# Backup database
cp adb_tracker.db backups/adb_tracker_$(date +%Y%m%d).db

# Backup config
cp .env backups/.env.backup
```

### Updating Configuration

```bash
# Edit configuration
nano .env

# Restart to apply changes
# (Ctrl+C to stop, then npm start)
```

## Telegram Commands Reference

| Command | What it does |
|---------|-------------|
| `/start` | Show welcome message |
| `/help` | Show all commands |
| `/status` | View all devices and their status |
| `/servers` | List all servers |
| `/devices` | List devices on a specific server |
| `/add <serial> <server_id>` | Add device to tracking |
| `/remove <serial> <server_id>` | Remove device from tracking |
| `/stats` | Show overall statistics |
| `/notify` | Enable notifications for this chat |

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                  Your Telegram App                    │
│                                                       │
│  You: /status                                         │
│  Bot: 🟢 Device ABC123 - online                       │
│       🔴 Device XYZ789 - offline                      │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ Internet
                    │
┌───────────────────▼──────────────────────────────────┐
│              Telegram Bot API                         │
└───────────────────┬──────────────────────────────────┘
                    │
                    │
┌───────────────────▼──────────────────────────────────┐
│           ADB Tracker Bot (Node.js)                   │
│                                                       │
│  ┌─────────────────┐      ┌──────────────────┐       │
│  │  Telegram Bot   │      │  Device Monitor  │       │
│  │  - Handle cmds  │      │  - Check devices │       │
│  │  - Send notifs  │      │  - Detect changes│       │
│  └────────┬────────┘      └─────────┬────────┘       │
│           │                         │                │
│           └──────────┬──────────────┘                │
│                      │                               │
│           ┌──────────▼──────────┐                    │
│           │   SQLite Database   │                    │
│           │   - Servers         │                    │
│           │   - Devices         │                    │
│           │   - Status changes  │                    │
│           └──────────┬──────────┘                    │
└──────────────────────┼───────────────────────────────┘
                       │
                       │ adb devices
                       │
┌──────────────────────▼───────────────────────────────┐
│                  USB Connected Devices                │
│                                                       │
│  [Samsung S21]  [Pixel 6]  [OnePlus 9]               │
└──────────────────────────────────────────────────────┘
```

## Multi-Server Architecture

```
Server 1 (Standalone Mode)          Server 2 (Agent Mode)
┌─────────────────────┐             ┌──────────────────┐
│ • Telegram Bot      │             │ • Monitor only   │
│ • Monitor           │             │                  │
│ • Devices: A, B, C  │             │ • Devices: D, E  │
└──────┬──────────────┘             └────────┬─────────┘
       │                                     │
       │    ┌────────────────────┐          │
       └────│  Shared Database   │──────────┘
            │  (NFS/SMB mount)   │
            └────────────────────┘

All devices tracked in one Telegram bot!
```

## Development Workflow

If you want to modify the code:

```bash
# 1. Make changes to src/*.ts files
# 2. Build
npm run build

# 3. Test
npm start

# 4. For auto-reload during development
npm run dev
```

## Troubleshooting Quick Guide

**Bot doesn't start?**
- Check `.env` has `TELEGRAM_BOT_TOKEN`
- Verify token is correct (from @BotFather)

**No devices detected?**
- Run `adb devices` manually
- Enable USB debugging on devices
- Accept USB debugging prompt

**Devices show as unauthorized?**
- Accept "Allow USB debugging" on device
- Unplug and replug USB cable

**Notifications not working?**
- Send `/notify` to bot first
- Check `TELEGRAM_ADMIN_CHAT_ID` in `.env`
- Verify bot can send messages to you

## Next Steps

Now that you understand the basics:

1. **Try it out**: Follow [QUICK-START.md](QUICK-START.md)
2. **Deploy properly**: Read [DEPLOYMENT.md](DEPLOYMENT.md)
3. **Customize**: Explore [ADVANCED-USAGE.md](ADVANCED-USAGE.md)
4. **Understand code**: Review [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)

## Getting Help

If you need help:

1. Check the documentation files (especially README.md)
2. Review console output for error messages
3. Verify your `.env` configuration
4. Check `adb devices` shows your devices
5. Test Telegram bot token manually

## Key Features Checklist

Use this to verify your setup:

- [ ] Bot responds to `/start` in Telegram
- [ ] `/status` shows your devices
- [ ] Unplugging device sends notification
- [ ] Plugging device back updates status
- [ ] Can add device with `/add`
- [ ] Can remove device with `/remove`
- [ ] Multiple servers tracked (if using multi-server)
- [ ] Notifications work in groups (if using groups)

## Pro Tips

1. **Use descriptive server names** to easily identify locations
2. **Set appropriate check intervals** (30-60s is usually good)
3. **Enable notifications in group chats** so your team stays informed
4. **Keep device serial numbers documented** for easy reference
5. **Back up the database regularly** (it contains all your tracking data)
6. **Monitor the monitor** - set up alerts if the bot goes down

## Conclusion

You now have a solid understanding of how ADB Tracker Bot works! The system is designed to be:

- **Easy to set up** - 5-minute quick start
- **Easy to use** - Simple Telegram commands
- **Easy to scale** - Multi-server support built-in
- **Easy to extend** - Clean, documented codebase

Enjoy tracking your device farm! 🚀
