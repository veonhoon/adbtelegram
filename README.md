# ADB Tracker Bot

A comprehensive multi-server ADB device monitoring system with Telegram notifications. Perfect for managing phone farms and tracking device status across multiple servers.

## Features

✅ **Multi-Server Support** - Track devices across unlimited servers
✅ **Real-time Monitoring** - Continuous status checking with configurable intervals
✅ **Telegram Integration** - Get notified instantly when devices go offline/unauthorized
✅ **Auto-Discovery** - Automatically detect connected ADB devices on startup
✅ **Easy Management** - Add/remove devices via Telegram commands
✅ **Status Tracking** - Monitor online, offline, and unauthorized device states
✅ **Scalable Architecture** - Ready for future web interface expansion
✅ **Persistent Storage** - SQLite database for reliable device tracking

## Architecture

The system supports two deployment modes:

### Standalone Mode
- Runs both monitor and Telegram bot on a single server
- Best for single-server setups or testing
- All-in-one solution

### Agent Mode (Multi-Server)
- Each server runs a monitoring agent
- Central server runs the Telegram bot
- All agents share a common database (can use network-mounted SQLite or future API)

## Prerequisites

- Node.js 18+ and npm
- Android SDK Platform Tools (adb) installed and in PATH
- Telegram Bot Token (get from [@BotFather](https://t.me/botfather))
- ADB devices connected via USB

## Quick Start

### 1. Installation

```bash
# Clone or download the project
cd adb-tracker-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file:

```env
# Get your bot token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Your Telegram chat ID (message @userinfobot to get it)
TELEGRAM_ADMIN_CHAT_ID=your_chat_id_here

# Server identification
SERVER_ID=server-1
SERVER_NAME=Main Server

# How often to check device status (in seconds)
CHECK_INTERVAL_SECONDS=30

# Mode: 'standalone' or 'agent'
MODE=standalone
```

### 3. Run the System

```bash
# Build the project
npm run build

# Start in standalone mode (monitor + bot)
npm start

# Or run in development mode
npm run dev
```

### 4. First Run

On first run, the system will:
1. Scan for connected ADB devices
2. Display found devices with their serials and status
3. Automatically add them to tracking
4. Start monitoring

### 5. Start Using Telegram Bot

Open Telegram and:
1. Find your bot by username
2. Send `/start` to see available commands
3. Use `/status` to check all devices
4. Use `/notify` to enable notifications for your chat

## Telegram Commands

### Basic Commands

- `/start` - Welcome message and command overview
- `/help` - Show detailed help
- `/status` - View status of all devices across all servers
- `/servers` - List all registered servers
- `/devices [server_id]` - List devices on a specific server
- `/stats` - Show overall statistics

### Device Management

- `/add <serial> <server_id>` - Add a device to tracking
  - Example: `/add ABC123 server-1`
- `/remove <serial> <server_id>` - Remove a device from tracking
  - Example: `/remove ABC123 server-1`

### Notifications

- `/notify` - Enable notifications for current chat/group

## Multi-Server Deployment

### Option 1: Shared Database (Simple)

All servers share the same database file via network mount:

**Server 1 (Main):**
```env
MODE=standalone
SERVER_ID=server-1
SERVER_NAME=Main Server
TELEGRAM_BOT_TOKEN=your_token
```

**Server 2, 3, etc (Agents):**
```env
MODE=agent
SERVER_ID=server-2
SERVER_NAME=Secondary Server
# No bot token needed
```

Mount the same database location on all servers:
```bash
# All servers should access the same adb_tracker.db file
# Use NFS, SMB, or other network file sharing
```

### Option 2: Individual Databases (Future API Mode)

Each server maintains its own database. A central API aggregates data (to be implemented).

## Project Structure

```
adb-tracker-bot/
├── src/
│   ├── database.ts         # SQLite database layer
│   ├── adb-monitor.ts      # ADB device detection and monitoring
│   ├── monitor.ts          # Device monitoring service
│   ├── telegram-bot.ts     # Telegram bot implementation
│   ├── bot.ts              # Bot-only launcher
│   └── index.ts            # Main entry point
├── dist/                   # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Running Individual Components

```bash
# Run only the monitor (no Telegram bot)
npm run monitor

# Run only the Telegram bot (no monitoring)
npm run bot

# Run everything together
npm start
```

## Adding/Removing Devices

### Via Telegram

Most convenient method:

```
/add ABC123 server-1
/remove ABC123 server-1
```

### Via Auto-Discovery

1. Connect new devices to the server
2. Restart the monitor
3. Devices will be auto-discovered and added

### Manually in Database

For advanced users, you can directly manipulate the SQLite database:

```bash
sqlite3 adb_tracker.db
> INSERT INTO devices (serial, server_id, status, last_check, added_at)
  VALUES ('ABC123', 'server-1', 'unknown', 1234567890, 1234567890);
```

## Moving Devices Between Servers

When you physically move a device to another server:

1. Remove from old server: `/remove ABC123 server-1`
2. Add to new server: `/add ABC123 server-2`

Or just add it to the new server - the system tracks by (serial, server_id) pair.

## Notification System

The bot automatically sends notifications when:
- Device goes offline
- Device comes back online
- Device becomes unauthorized
- Any status change occurs

Notifications are sent to all chats that have enabled notifications with `/notify`.

## Status Icons

- 🟢 Online - Device is connected and authorized
- 🔴 Offline - Device is not connected
- ⚠️ Unauthorized - Device is connected but unauthorized (USB debugging not allowed)
- ⚪ Unknown - Status not yet determined

## Troubleshooting

### ADB not found
```bash
# Verify ADB is installed
adb version

# Add to PATH if needed (Linux/Mac)
export PATH=$PATH:/path/to/android-sdk/platform-tools

# Windows
# Add platform-tools to System Environment Variables PATH
```

### Devices not detected
```bash
# Check ADB devices manually
adb devices -l

# Restart ADB server
adb kill-server
adb start-server

# Check USB debugging is enabled on devices
# Check USB cables and connections
```

### Bot not responding
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check bot is running: `ps aux | grep bot`
- Check for errors in console output
- Verify internet connection

### Database locked errors
- Only one process can write to SQLite at a time
- Don't run multiple monitors on the same database simultaneously without agent mode
- Use network file sharing carefully (can cause locking issues)

## Future Enhancements

The architecture is designed to support:

- ✨ Web dashboard for visual monitoring
- ✨ REST API for multi-server coordination
- ✨ Device health metrics (battery, storage, etc.)
- ✨ Historical analytics and reporting
- ✨ Alert rules and custom thresholds
- ✨ Device groups and tags
- ✨ Multiple Telegram bot support

## Database Schema

### Servers Table
- `id` - Unique server identifier
- `name` - Human-readable server name
- `last_seen` - Timestamp of last activity
- `status` - online/offline

### Devices Table
- `serial` - Device serial number (ADB identifier)
- `server_id` - Which server this device is connected to
- `status` - online/offline/unauthorized/unknown
- `last_status` - Previous status (for change detection)
- `last_check` - Timestamp of last status check
- `added_at` - When device was added to tracking

### Status Changes Table
- `id` - Auto-increment ID
- `device_serial` - Device that changed
- `server_id` - Server where change occurred
- `old_status` - Previous status
- `new_status` - New status
- `timestamp` - When change occurred
- `notified` - Whether notification was sent (0/1)

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run compiled version
npm start
```

## Contributing

This is a foundational implementation designed for easy customization:

1. Fork the repository
2. Add your features
3. Test thoroughly with your device farm
4. Submit pull requests

## License

MIT License - feel free to use and modify for your needs.

## Support

For issues or questions:
1. Check this README
2. Review console logs for error messages
3. Verify ADB and Telegram configuration
4. Check device connections

## Credits

Built with:
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [node-cron](https://github.com/node-cron/node-cron)
- TypeScript & Node.js
