# Advanced Usage Guide

This guide covers advanced scenarios and customization options for ADB Tracker Bot.

## Multi-Server Setup

### Architecture Overview

```
┌─────────────────┐
│   Server 1      │
│  (Standalone)   │──┐
│  • Monitor      │  │
│  • Telegram Bot │  │
└─────────────────┘  │
                     │    ┌──────────────┐
┌─────────────────┐  │    │   Shared     │
│   Server 2      │  ├────│   SQLite     │
│    (Agent)      │──┤    │   Database   │
│  • Monitor only │  │    └──────────────┘
└─────────────────┘  │
                     │
┌─────────────────┐  │
│   Server 3      │  │
│    (Agent)      │──┘
│  • Monitor only │
└─────────────────┘
```

### Setup Steps

**1. Set up shared storage**

Using NFS (Linux):

```bash
# On main server
sudo apt install nfs-kernel-server
sudo mkdir -p /srv/adb-tracker
sudo chown nobody:nogroup /srv/adb-tracker
echo "/srv/adb-tracker *(rw,sync,no_subtree_check)" | sudo tee -a /etc/exports
sudo exportfs -ra

# On agent servers
sudo apt install nfs-common
sudo mkdir -p /mnt/adb-tracker
sudo mount main-server:/srv/adb-tracker /mnt/adb-tracker

# Add to /etc/fstab for persistence
echo "main-server:/srv/adb-tracker /mnt/adb-tracker nfs defaults 0 0" | sudo tee -a /etc/fstab
```

**2. Configure each server**

Main Server `.env`:
```env
MODE=standalone
SERVER_ID=rack-1
SERVER_NAME=Rack 1 - Main
TELEGRAM_BOT_TOKEN=your_token
CHECK_INTERVAL_SECONDS=30
```

Agent Server `.env`:
```env
MODE=agent
SERVER_ID=rack-2
SERVER_NAME=Rack 2 - Secondary
CHECK_INTERVAL_SECONDS=30
```

**3. Symlink database**

```bash
# On main server
cd /path/to/adb-tracker-bot
ln -s /srv/adb-tracker/adb_tracker.db adb_tracker.db

# On agent servers
cd /path/to/adb-tracker-bot
ln -s /mnt/adb-tracker/adb_tracker.db adb_tracker.db
```

**4. Start services**

```bash
# On main server (runs both monitor and bot)
npm start

# On agent servers (runs monitor only)
npm run monitor
```

## Device Organization Strategies

### Strategy 1: Server-Based Organization

Best for: Physical rack locations

```
Server 1: Rack A - Floor 1
  - Device A1, A2, A3...

Server 2: Rack B - Floor 1
  - Device B1, B2, B3...

Server 3: Rack C - Floor 2
  - Device C1, C2, C3...
```

Use descriptive SERVER_NAME values:
```env
SERVER_NAME=Rack A - Floor 1
```

### Strategy 2: Purpose-Based Organization

Best for: Different device types/purposes

```
Server 1: Test Devices
  - Samsung Galaxy S21, S22, S23...

Server 2: Production Devices
  - iPhone 12, 13, 14...

Server 3: Debug Devices
  - Google Pixel 6, 7, 8...
```

### Strategy 3: Hybrid Approach

Combine location and purpose in naming:

```env
SERVER_ID=prod-rack-a1
SERVER_NAME=Production - Rack A1 - Samsung
```

## Custom Notification Rules

### Modify Notification Behavior

Edit [telegram-bot.ts](src/telegram-bot.ts):

```typescript
async notifyStatusChange(serial: string, serverId: string, oldStatus: string, newStatus: string): Promise<void> {
  // Only notify on critical changes
  if (newStatus === 'offline' || newStatus === 'unauthorized') {
    // Send notification
  }

  // Don't notify when devices come back online
  // (Reduces notification spam)
}
```

### Add Custom Alert Rules

```typescript
// Alert only for specific devices
const criticalDevices = ['ABC123', 'XYZ789'];
if (!criticalDevices.includes(serial)) {
  return; // Skip notification
}

// Alert only during business hours
const hour = new Date().getHours();
if (hour < 9 || hour > 17) {
  return; // Skip after-hours notifications
}

// Alert with different urgency
if (newStatus === 'unauthorized') {
  // Send HIGH priority
  message = '🚨 URGENT: ' + message;
} else {
  // Send normal priority
  message = '⚠️ ' + message;
}
```

### Multiple Notification Channels

```typescript
// Send to different chats based on server
const serverNotificationMap: Record<string, string[]> = {
  'server-1': ['chat_id_1', 'chat_id_2'],
  'server-2': ['chat_id_3'],
  'server-3': ['chat_id_1', 'chat_id_4']
};

const chatsToNotify = serverNotificationMap[serverId] || [];
```

## Database Operations

### Direct Database Access

```bash
# Open database
sqlite3 adb_tracker.db

# List all devices
SELECT * FROM devices;

# View recent status changes
SELECT * FROM status_changes ORDER BY timestamp DESC LIMIT 10;

# Get devices by status
SELECT * FROM devices WHERE status = 'offline';

# Count devices per server
SELECT server_id, COUNT(*) as count FROM devices GROUP BY server_id;
```

### Bulk Operations

Add multiple devices:

```sql
INSERT INTO devices (serial, server_id, status, last_check, added_at)
VALUES
  ('DEV001', 'server-1', 'unknown', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('DEV002', 'server-1', 'unknown', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('DEV003', 'server-1', 'unknown', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
```

Move all devices from one server to another:

```sql
UPDATE devices SET server_id = 'server-2' WHERE server_id = 'server-1';
```

### Export/Import Devices

Export device list:

```bash
sqlite3 adb_tracker.db "SELECT serial, server_id FROM devices" > devices.csv
```

Import from CSV (requires scripting):

```bash
while IFS=, read -r serial server_id; do
  # Use Telegram bot /add command or direct SQL
  echo "Adding $serial to $server_id"
done < devices.csv
```

## Performance Optimization

### Adjust Check Interval

For 100+ devices across multiple servers:

```env
# Reduce frequency to lower CPU usage
CHECK_INTERVAL_SECONDS=60
```

For critical monitoring:

```env
# Check more frequently
CHECK_INTERVAL_SECONDS=10
```

### Database Optimization

```sql
-- Vacuum database to reduce size
VACUUM;

-- Analyze for query optimization
ANALYZE;

-- Clean old status changes (older than 30 days)
DELETE FROM status_changes
WHERE timestamp < (strftime('%s', 'now') - 2592000) * 1000;
```

### Limit Status Change History

Modify [database.ts](src/database.ts):

```typescript
// Auto-cleanup old records
setInterval(() => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  this.db.prepare('DELETE FROM status_changes WHERE timestamp < ?').run(thirtyDaysAgo);
}, 24 * 60 * 60 * 1000); // Run daily
```

## Custom Commands

### Add New Telegram Commands

Edit [telegram-bot.ts](src/telegram-bot.ts):

```typescript
// Add to setupCommands()
this.bot.onText(/\/reboot (\S+) (\S+)/, async (msg, match) => {
  const [serial, serverId] = [match[1], match[2]];

  // Implement ADB reboot
  await this.adbMonitor.rebootDevice(serial);
  this.bot.sendMessage(msg.chat.id, `✓ Rebooting ${serial}`);
});

this.bot.onText(/\/health/, async (msg) => {
  // Show system health
  const stats = this.db.getStats();
  const uptime = process.uptime();

  const message = `
🏥 System Health
Uptime: ${Math.floor(uptime / 3600)}h
Devices: ${stats.online}/${stats.devices} online
Memory: ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)}MB
  `;

  this.bot.sendMessage(msg.chat.id, message);
});
```

### Add Scheduled Reports

```typescript
// In telegram-bot.ts constructor
import cron from 'node-cron';

// Daily status report at 9 AM
cron.schedule('0 9 * * *', () => {
  this.handleStatsCommand(this.adminChatId);
});

// Hourly health check
cron.schedule('0 * * * *', async () => {
  const stats = this.db.getStats();
  if (stats.offline > 5) {
    this.bot.sendMessage(this.adminChatId,
      `⚠️ Warning: ${stats.offline} devices offline`);
  }
});
```

## ADB Advanced Operations

### Add Device Info to Status

Modify [adb-monitor.ts](src/adb-monitor.ts):

```typescript
async getExtendedDeviceInfo(serial: string): Promise<any> {
  const info = await this.getDeviceInfo(serial);

  // Add battery level
  const battery = await execAsync(`adb -s ${serial} shell dumpsys battery | grep level`);
  info.battery = battery.stdout.match(/\d+/)?.[0] || 'unknown';

  // Add storage
  const storage = await execAsync(`adb -s ${serial} shell df /data`);
  info.storage = storage.stdout;

  return info;
}
```

### Implement Device Actions

```typescript
// Add to adb-monitor.ts
async rebootDevice(serial: string): Promise<void> {
  await execAsync(`adb -s ${serial} reboot`);
}

async screenshotDevice(serial: string, outputPath: string): Promise<void> {
  await execAsync(`adb -s ${serial} exec-out screencap -p > ${outputPath}`);
}

async installAPK(serial: string, apkPath: string): Promise<void> {
  await execAsync(`adb -s ${serial} install ${apkPath}`);
}
```

## Integration with Other Systems

### Webhook Notifications

Add webhook support for integration with other monitoring systems:

```typescript
// In monitor.ts onStatusChange callback
if (this.config.webhookUrl) {
  await axios.post(this.config.webhookUrl, {
    event: 'status_change',
    device: serial,
    server: this.config.serverId,
    old_status: oldStatus,
    new_status: newStatus,
    timestamp: Date.now()
  });
}
```

### REST API for Web Dashboard

Create [api.ts](src/api.ts):

```typescript
import express from 'express';
import { ADBDatabase } from './database';

const app = express();
const db = new ADBDatabase();

app.get('/api/devices', (req, res) => {
  const devices = db.getAllDevices();
  res.json(devices);
});

app.get('/api/servers', (req, res) => {
  const servers = db.getAllServers();
  res.json(servers);
});

app.get('/api/stats', (req, res) => {
  const stats = db.getStats();
  res.json(stats);
});

app.listen(3000, () => {
  console.log('API running on port 3000');
});
```

### Prometheus Metrics

```typescript
// Add metrics endpoint
app.get('/metrics', (req, res) => {
  const stats = db.getStats();

  const metrics = `
# HELP adb_devices_total Total number of devices
# TYPE adb_devices_total gauge
adb_devices_total ${stats.devices}

# HELP adb_devices_online Number of online devices
# TYPE adb_devices_online gauge
adb_devices_online ${stats.online}

# HELP adb_devices_offline Number of offline devices
# TYPE adb_devices_offline gauge
adb_devices_offline ${stats.offline}
  `;

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

## Troubleshooting Complex Setups

### Debug Multi-Server Issues

Enable verbose logging:

```typescript
// In monitor.ts
console.log(`[${this.config.serverId}] Checking device ${device.serial}...`);
console.log(`[${this.config.serverId}] Status: ${currentStatus}`);
```

### Database Locking

If experiencing locks with network storage:

```typescript
// In database.ts constructor
this.db = new Database(dbPath, {
  timeout: 10000, // Wait up to 10s for locks
  verbose: console.log // Debug queries
});

// Use WAL mode for better concurrency
this.db.pragma('journal_mode = WAL');
```

### Monitor Performance

```typescript
// Track check duration
const startTime = Date.now();
await this.checkDevices();
const duration = Date.now() - startTime;

if (duration > 5000) {
  console.warn(`⚠️  Device check took ${duration}ms`);
}
```

## Best Practices

1. **Naming Convention**: Use consistent SERVER_ID patterns (e.g., `rack-1-a`, `rack-1-b`)
2. **Check Interval**: Balance between responsiveness and resource usage (30-60s recommended)
3. **Database Backups**: Automate daily backups before implementing critical changes
4. **Monitoring**: Set up alerts for bot/monitor downtime
5. **Documentation**: Document your specific server layout and device organization
6. **Testing**: Test notification delivery after any configuration changes
7. **Security**: Restrict Telegram bot access to authorized users only
8. **Maintenance**: Regularly clean old status_changes records

## Future Development Ideas

The codebase is structured to easily add:

- **Web Dashboard**: Real-time device grid with status colors
- **Device Groups**: Organize devices by project/team
- **Alert Rules**: Custom conditions for notifications
- **Device Metrics**: Battery, storage, temperature tracking
- **Automated Recovery**: Auto-reboot unresponsive devices
- **Historical Charts**: Device uptime over time
- **Multi-User**: Different permissions for different users
- **Device Reservations**: "Check out" devices for testing

Contribute your enhancements back to the project!
