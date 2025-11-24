# Project Structure

Complete overview of the ADB Tracker Bot codebase.

## Directory Layout

```
adb-tracker-bot/
├── src/                          # TypeScript source code
│   ├── database.ts               # SQLite database layer
│   ├── adb-monitor.ts            # ADB device detection
│   ├── monitor.ts                # Device monitoring service
│   ├── telegram-bot.ts           # Telegram bot implementation
│   ├── bot.ts                    # Bot-only entry point
│   └── index.ts                  # Main entry point
├── dist/                         # Compiled JavaScript (auto-generated)
├── scripts/                      # Setup and utility scripts
│   ├── setup.sh                  # Linux/Mac setup script
│   └── setup.bat                 # Windows setup script
├── node_modules/                 # Dependencies (auto-generated)
├── package.json                  # Project metadata and dependencies
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment template
├── .env                          # Your configuration (git-ignored)
├── .gitignore                    # Git ignore rules
├── LICENSE                       # MIT License
├── README.md                     # Main documentation
├── QUICK-START.md                # 5-minute setup guide
├── DEPLOYMENT.md                 # Production deployment guide
├── ADVANCED-USAGE.md             # Advanced features and customization
└── PROJECT-STRUCTURE.md          # This file
```

## Core Components

### 1. Database Layer ([database.ts](src/database.ts))

**Responsibilities:**
- SQLite database initialization and schema
- CRUD operations for servers, devices, and status changes
- Data validation and integrity
- Statistics and reporting

**Key Classes:**
- `ADBDatabase` - Main database interface

**Key Methods:**
- `upsertServer()` - Add/update server
- `addDevice()` - Add device to tracking
- `updateDeviceStatus()` - Update device status
- `getUnnotifiedChanges()` - Get pending notifications

**Database Schema:**

```sql
-- Servers table
CREATE TABLE servers (
  id TEXT PRIMARY KEY,           -- e.g., 'server-1'
  name TEXT NOT NULL,            -- e.g., 'Main Server'
  last_seen INTEGER,             -- Unix timestamp
  status TEXT                    -- 'online' or 'offline'
);

-- Devices table
CREATE TABLE devices (
  serial TEXT NOT NULL,          -- ADB serial number
  server_id TEXT NOT NULL,       -- Foreign key to servers
  status TEXT NOT NULL,          -- 'online', 'offline', 'unauthorized', 'unknown'
  last_status TEXT,              -- Previous status
  last_check INTEGER,            -- Unix timestamp
  added_at INTEGER,              -- Unix timestamp
  PRIMARY KEY (serial, server_id)
);

-- Status changes history
CREATE TABLE status_changes (
  id INTEGER PRIMARY KEY,
  device_serial TEXT,
  server_id TEXT,
  old_status TEXT,
  new_status TEXT,
  timestamp INTEGER,
  notified INTEGER               -- 0 or 1 (boolean)
);
```

### 2. ADB Monitor ([adb-monitor.ts](src/adb-monitor.ts))

**Responsibilities:**
- Execute ADB commands
- Parse ADB output
- Detect connected devices
- Get device information

**Key Classes:**
- `ADBMonitor` - ADB interface

**Key Methods:**
- `getConnectedDevices()` - List all connected devices
- `getDeviceStatus()` - Get status of specific device
- `isADBAvailable()` - Check if ADB is installed
- `restartADBServer()` - Restart ADB daemon

**ADB Commands Used:**
```bash
adb devices -l              # List devices
adb version                 # Check ADB version
adb -s <serial> shell       # Execute shell commands
```

### 3. Device Monitor ([monitor.ts](src/monitor.ts))

**Responsibilities:**
- Periodic device status checking
- Status change detection
- Server registration
- Device discovery on startup

**Key Classes:**
- `DeviceMonitor` - Main monitoring service

**Key Methods:**
- `initialize()` - Register server in database
- `discoverDevices()` - Auto-detect connected devices
- `start()` - Begin monitoring loop
- `checkDevices()` - Check status of all tracked devices
- `stop()` - Stop monitoring

**Process Flow:**
```
1. Initialize server
2. Check for tracked devices
3. If none, run discovery
4. Start periodic checking (cron job)
5. On status change → log to database
6. Trigger notification callback
```

### 4. Telegram Bot ([telegram-bot.ts](src/telegram-bot.ts))

**Responsibilities:**
- Telegram bot API integration
- Command handling
- Notification sending
- User interaction

**Key Classes:**
- `ADBTelegramBot` - Telegram bot implementation

**Command Handlers:**
- `/start` - Welcome message
- `/help` - Help text
- `/status` - Show all devices
- `/servers` - List servers
- `/devices [server_id]` - List devices on server
- `/add <serial> <server_id>` - Add device
- `/remove <serial> <server_id>` - Remove device
- `/stats` - Show statistics
- `/notify` - Enable notifications

**Key Methods:**
- `notifyStatusChange()` - Send notification about status change
- `startNotificationPolling()` - Poll for unnotified changes
- `handleStatusCommand()` - Handle /status command

### 5. Entry Points

#### [index.ts](src/index.ts) - Main Entry Point

**Modes:**
- **Standalone**: Runs both monitor and bot
- **Agent**: Runs only monitor

**Usage:**
```bash
npm start       # Uses index.ts
```

#### [bot.ts](src/bot.ts) - Bot Only

**Purpose:** Run only Telegram bot without monitoring

**Usage:**
```bash
npm run bot     # Uses bot.ts
```

#### [monitor.ts](src/monitor.ts) - Monitor Only

**Purpose:** Run only device monitor without bot

**Usage:**
```bash
npm run monitor # Uses monitor.ts as standalone
```

## Data Flow

### Device Status Update Flow

```
┌─────────────────┐
│  Cron Scheduler │
│  (every 30s)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  monitor.checkDevices() │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  For each tracked       │
│  device:                │
│  1. adb-monitor.        │
│     getDeviceStatus()   │
│  2. db.updateDevice     │
│     Status()            │
└────────┬────────────────┘
         │
         ▼
    Status changed?
         │
    ┌────┴────┐
    │   Yes   │
    └────┬────┘
         │
         ▼
┌─────────────────────────┐
│  Log to status_changes  │
│  table (notified=0)     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Notification Polling   │
│  (every 5s)             │
│  1. Get unnotified      │
│  2. Send via Telegram   │
│  3. Mark as notified    │
└─────────────────────────┘
```

### Command Handling Flow

```
┌──────────────┐
│ User sends   │
│ /status in   │
│ Telegram     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Telegram Bot API     │
│ receives update      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ telegram-bot.ts      │
│ handleStatusCommand()│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ database.ts          │
│ getAllDevices()      │
│ getAllServers()      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Format message with  │
│ icons and status     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ bot.sendMessage()    │
│ back to user         │
└──────────────────────┘
```

## Configuration

### Environment Variables ([.env](/.env))

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes (standalone) | - | From @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | No | - | Your chat ID |
| `SERVER_ID` | No | server-1 | Unique identifier |
| `SERVER_NAME` | No | Main Server | Display name |
| `CHECK_INTERVAL_SECONDS` | No | 30 | Check frequency |
| `MODE` | No | standalone | standalone/agent |

### TypeScript Configuration ([tsconfig.json](tsconfig.json))

- **Target:** ES2020
- **Module:** CommonJS
- **Output:** `./dist`
- **Strict mode:** Enabled

### Package Scripts ([package.json](package.json))

```json
{
  "build": "tsc",              // Compile TypeScript
  "start": "node dist/index.js", // Run standalone mode
  "dev": "ts-node src/index.ts", // Development mode
  "monitor": "ts-node src/monitor.ts", // Monitor only
  "bot": "ts-node src/bot.ts"  // Bot only
}
```

## Dependencies

### Runtime Dependencies

- **node-telegram-bot-api** - Telegram Bot API wrapper
- **better-sqlite3** - Fast SQLite3 database
- **express** - HTTP server (for future API)
- **dotenv** - Environment variable management
- **node-cron** - Task scheduling
- **axios** - HTTP client (for future features)

### Development Dependencies

- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution
- **@types/** - TypeScript type definitions

## Extending the System

### Adding a New Command

1. Edit [src/telegram-bot.ts](src/telegram-bot.ts)
2. Add to `setupCommands()`:

```typescript
this.bot.onText(/\/mycommand/, async (msg) => {
  await this.handleMyCommand(msg.chat.id);
});
```

3. Implement handler:

```typescript
private async handleMyCommand(chatId: number): Promise<void> {
  // Your logic here
  this.bot.sendMessage(chatId, 'Response');
}
```

### Adding a Database Table

1. Edit [src/database.ts](src/database.ts)
2. Add schema in `initTables()`:

```typescript
this.db.exec(`
  CREATE TABLE IF NOT EXISTS my_table (
    id INTEGER PRIMARY KEY,
    data TEXT
  )
`);
```

3. Add methods:

```typescript
addData(data: string): void {
  const stmt = this.db.prepare('INSERT INTO my_table (data) VALUES (?)');
  stmt.run(data);
}
```

### Adding ADB Functionality

1. Edit [src/adb-monitor.ts](src/adb-monitor.ts)
2. Add method:

```typescript
async myADBCommand(serial: string): Promise<string> {
  const { stdout } = await execAsync(`adb -s ${serial} shell ...`);
  return stdout;
}
```

## Testing Checklist

- [ ] `adb devices` shows connected devices
- [ ] Bot responds to `/start`
- [ ] `/status` shows correct device states
- [ ] Unplugging device triggers notification
- [ ] `/add` and `/remove` work correctly
- [ ] Database persists between restarts
- [ ] Multiple servers tracked correctly
- [ ] Service restarts automatically

## Common Modification Points

| Want to... | Edit this file | Look for... |
|------------|---------------|-------------|
| Change check frequency | `.env` | `CHECK_INTERVAL_SECONDS` |
| Add Telegram command | `telegram-bot.ts` | `setupCommands()` |
| Modify notification format | `telegram-bot.ts` | `notifyStatusChange()` |
| Add database field | `database.ts` | `initTables()` |
| Change device detection | `adb-monitor.ts` | `getConnectedDevices()` |
| Add ADB command | `adb-monitor.ts` | Add new method |
| Modify status icons | `telegram-bot.ts` | `getStatusIcon()` |

## Performance Considerations

- **Database:** SQLite handles ~10K devices easily
- **Polling:** 30-second interval = 2 checks/minute/device
- **Memory:** ~50MB base + ~1KB per device
- **CPU:** Minimal (mostly waiting on ADB)

## Security Notes

- `.env` is git-ignored (contains secrets)
- Database has no authentication (local file)
- Bot has no access control (add manually if needed)
- ADB runs with system privileges

## Future Architecture (Web Dashboard)

Planned structure:

```
src/
├── api/                    # REST API
│   ├── routes/
│   ├── middleware/
│   └── server.ts
├── web/                    # Web frontend
│   ├── components/
│   ├── pages/
│   └── App.tsx
└── shared/                 # Shared types
    └── types.ts
```

The current codebase is designed to support this expansion without major refactoring.
