# Deployment Guide

This guide covers deploying ADB Tracker Bot to multiple servers in a production environment.

## Deployment Scenarios

### Scenario 1: Single Server (Standalone Mode)

Perfect for: Small setups with all devices on one server.

**Steps:**

1. Install Node.js and ADB on the server
2. Clone/copy the project to the server
3. Configure `.env`:
   ```env
   MODE=standalone
   SERVER_ID=main
   SERVER_NAME=Main Server
   TELEGRAM_BOT_TOKEN=your_token
   TELEGRAM_ADMIN_CHAT_ID=your_chat_id
   CHECK_INTERVAL_SECONDS=30
   ```
4. Install and build:
   ```bash
   npm install
   npm run build
   ```
5. Run:
   ```bash
   npm start
   ```

### Scenario 2: Multiple Servers with Shared Database

Perfect for: Multiple servers that can access a shared network drive.

**Server 1 (Main) - Runs Bot + Monitor:**

```env
MODE=standalone
SERVER_ID=server-1
SERVER_NAME=Rack 1
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
```

**Server 2, 3, etc - Run Monitor Only:**

```env
MODE=agent
SERVER_ID=server-2
SERVER_NAME=Rack 2
# No bot token needed
```

**Shared Database Setup:**

Mount network drive on all servers:

```bash
# Linux/Mac - NFS mount
sudo mount server1:/path/to/tracker /mnt/tracker

# Or use SMB/CIFS
sudo mount -t cifs //server1/tracker /mnt/tracker

# Update database path in code or symlink
ln -s /mnt/tracker/adb_tracker.db ./adb_tracker.db
```

### Scenario 3: Future API-Based (Coming Soon)

Each server has its own database and exposes an API. Central bot aggregates via API calls.

## Running as a Service

### Linux (systemd)

Create `/etc/systemd/system/adb-tracker.service`:

```ini
[Unit]
Description=ADB Tracker Bot
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/adb-tracker-bot
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable adb-tracker
sudo systemctl start adb-tracker
sudo systemctl status adb-tracker
```

View logs:

```bash
sudo journalctl -u adb-tracker -f
```

### Linux (PM2)

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "adb-tracker" -- start

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### Windows Service

Use [node-windows](https://github.com/coreybutler/node-windows):

```javascript
// install-service.js
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'ADB Tracker Bot',
  description: 'ADB Device Monitoring System',
  script: 'C:\\path\\to\\adb-tracker-bot\\dist\\index.js',
  nodeOptions: []
});

svc.on('install', () => {
  svc.start();
});

svc.install();
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes (standalone) | - | Bot token from @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | No | - | Default chat for notifications |
| `SERVER_ID` | No | server-1 | Unique server identifier |
| `SERVER_NAME` | No | Main Server | Human-readable server name |
| `CHECK_INTERVAL_SECONDS` | No | 30 | How often to check devices |
| `MODE` | No | standalone | 'standalone' or 'agent' |
| `API_PORT` | No | 3000 | Port for future API (not used yet) |

## Security Considerations

### Telegram Bot Token

- **Never commit** `.env` file to git
- Store token securely (environment variables, secrets manager)
- Regenerate token if compromised

### Chat ID Restrictions

To restrict bot access to specific users/groups, modify [telegram-bot.ts](src/telegram-bot.ts):

```typescript
// Add at the start of command handlers
const allowedChatIds = [123456789, 987654321]; // Your chat IDs
if (!allowedChatIds.includes(msg.chat.id)) {
  this.bot.sendMessage(msg.chat.id, '❌ Unauthorized');
  return;
}
```

### File Permissions

```bash
# Protect .env file
chmod 600 .env

# Protect database
chmod 600 adb_tracker.db
```

## Backup Strategy

### Database Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
cp adb_tracker.db backups/adb_tracker_$DATE.db

# Keep only last 7 days
find backups/ -name "adb_tracker_*.db" -mtime +7 -delete
```

Add to crontab:

```bash
# Run backup daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### Configuration Backup

Keep `.env` in secure backup location or secrets manager.

## Monitoring the Monitor

### Health Check Script

```bash
#!/bin/bash
# check-adb-tracker.sh

if ! pgrep -f "adb-tracker" > /dev/null; then
  echo "ADB Tracker is not running!"
  # Restart service
  systemctl restart adb-tracker
  # Send alert
fi
```

### Log Rotation

For systemd services, journald handles rotation automatically.

For PM2:

```javascript
// pm2-config.json
{
  "apps": [{
    "name": "adb-tracker",
    "script": "npm",
    "args": "start",
    "log_date_format": "YYYY-MM-DD HH:mm:ss",
    "error_file": "logs/error.log",
    "out_file": "logs/out.log",
    "log_file": "logs/combined.log",
    "max_size": "10M",
    "retain": 7
  }]
}
```

## Scaling Considerations

### Database Performance

SQLite works well for:
- < 10 servers
- < 1000 devices
- < 1 write per second

For larger deployments:
- Consider PostgreSQL or MySQL
- Implement API-based architecture
- Separate read/write databases

### Multiple Bot Instances

Currently, run only ONE bot instance (multiple monitors OK).

Future enhancement: Support multiple bot instances with shared queue.

## Network Requirements

### Firewall Rules

If using network database:
- Allow NFS (port 2049) or SMB (port 445)
- Ensure servers can reach shared storage

For Telegram:
- Allow outbound HTTPS (port 443) to api.telegram.org
- No inbound ports required

### Bandwidth

Minimal bandwidth required:
- Telegram API: ~1 KB per message
- Status checks: Local, no network
- Typical usage: < 1 MB/day per server

## Troubleshooting Deployment

### Service won't start

```bash
# Check logs
sudo journalctl -u adb-tracker -n 50

# Verify Node.js version
node --version  # Should be 18+

# Check environment
sudo systemctl show adb-tracker | grep Environment

# Test manually
cd /path/to/adb-tracker-bot
npm start
```

### Database locking issues

```bash
# Check who's using database
lsof adb_tracker.db

# Verify file permissions
ls -l adb_tracker.db

# Check NFS mount (if using network storage)
df -h | grep tracker
```

### ADB not available in service

Add ADB to PATH in service file:

```ini
[Service]
Environment="PATH=/usr/local/bin:/usr/bin:/bin:/path/to/platform-tools"
```

## Production Checklist

- [ ] Node.js 18+ installed
- [ ] ADB installed and in PATH
- [ ] `.env` configured correctly
- [ ] Database directory writable
- [ ] Service/daemon configured
- [ ] Backup script set up
- [ ] Telegram bot token secured
- [ ] Log rotation configured
- [ ] Health monitoring set up
- [ ] Firewall rules configured (if needed)
- [ ] Tested device add/remove
- [ ] Tested notification delivery
- [ ] Documented server-specific setup

## Quick Deployment Script

```bash
#!/bin/bash
# deploy.sh - Quick deployment script

echo "🚀 ADB Tracker Bot Deployment"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }
command -v adb >/dev/null 2>&1 || { echo "❌ ADB required"; exit 1; }

# Install dependencies
npm install

# Build
npm run build

# Setup .env if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from template"
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration"
  exit 0
fi

# Test run
echo "✓ Testing configuration..."
timeout 5 npm start || true

echo "✅ Deployment complete!"
echo "Run: npm start"
```

Make executable:

```bash
chmod +x deploy.sh
./deploy.sh
```
