import TelegramBot from 'node-telegram-bot-api';
import { ADBDatabase, Device, Server } from './database';
import { ADBMonitor } from './adb-monitor';

export interface BotConfig {
  token: string;
  database: ADBDatabase;
  adminChatId?: string;
}

export class ADBTelegramBot {
  private bot: TelegramBot;
  private db: ADBDatabase;
  private adbMonitor: ADBMonitor;
  private adminChatId?: string;
  private notificationChats: Set<string> = new Set();

  constructor(config: BotConfig) {
    this.bot = new TelegramBot(config.token, { polling: true });
    this.db = config.database;
    this.adbMonitor = new ADBMonitor();
    this.adminChatId = config.adminChatId;

    if (this.adminChatId) {
      this.notificationChats.add(this.adminChatId);
    }

    this.setupCommands();
  }

  private setupCommands(): void {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🤖 *ADB Tracker Bot*

Welcome! I monitor ADB devices across multiple servers.

*Available Commands:*
/status - View status of all devices
/servers - List all servers
/devices - List devices by server
/add - Add a device to tracking
/remove - Remove a device from tracking
/stats - Show statistics
/notify - Enable notifications for this chat
/help - Show this help message

Use these commands to manage your device farm!
      `.trim();

      this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, this.getHelpMessage(), { parse_mode: 'Markdown' });
    });

    // Status command
    this.bot.onText(/\/status/, async (msg) => {
      await this.handleStatusCommand(msg.chat.id);
    });

    // Servers command
    this.bot.onText(/\/servers/, async (msg) => {
      await this.handleServersCommand(msg.chat.id);
    });

    // Devices command
    this.bot.onText(/\/devices(?:\s+(.+))?/, async (msg, match) => {
      const serverId = match?.[1]?.trim();
      await this.handleDevicesCommand(msg.chat.id, serverId);
    });

    // Add device command
    this.bot.onText(/\/add(?:\s+(.+))?/, async (msg, match) => {
      const args = match?.[1]?.trim();
      await this.handleAddCommand(msg.chat.id, args);
    });

    // Remove device command
    this.bot.onText(/\/remove(?:\s+(.+))?/, async (msg, match) => {
      const args = match?.[1]?.trim();
      await this.handleRemoveCommand(msg.chat.id, args);
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      await this.handleStatsCommand(msg.chat.id);
    });

    // Notify command
    this.bot.onText(/\/notify/, (msg) => {
      this.notificationChats.add(msg.chat.id.toString());
      this.bot.sendMessage(msg.chat.id, '✓ Notifications enabled for this chat');
    });

    // Scan command (discover devices on a server)
    this.bot.onText(/\/scan(?:\s+(.+))?/, async (msg, match) => {
      const serverId = match?.[1]?.trim();
      await this.handleScanCommand(msg.chat.id, serverId);
    });

    // Rename device command
    this.bot.onText(/\/rename(?:\s+(.+))?/, async (msg, match) => {
      const args = match?.[1]?.trim();
      await this.handleRenameCommand(msg.chat.id, args);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  private getHelpMessage(): string {
    return `
📖 *ADB Tracker Bot - Help*

*Basic Commands:*
/status - View all devices status
/servers - List all servers
/devices [server_id] - List devices on a server
/stats - Show overall statistics

*Device Management:*
/add <serial> <server_id> [name] - Add device to tracking
/remove <serial> <server_id> - Remove device
/rename <serial> <server_id> <name> - Rename a device
/scan [server_id] - Scan for new devices

*Notifications:*
/notify - Enable notifications for this chat

*Examples:*
\`/devices server-1\`
\`/add ABC123 server-1 Phone-1\`
\`/rename ABC123 server-1 Phone-2\`
\`/remove ABC123 server-1\`
    `.trim();
  }

  private async handleStatusCommand(chatId: number): Promise<void> {
    const devices = this.db.getAllDevices();
    const servers = this.db.getAllServers();

    if (devices.length === 0) {
      this.bot.sendMessage(chatId, '⚠️ No devices are being tracked yet.\n\nUse /scan to discover devices or /add to manually add them.');
      return;
    }

    let message = '📊 *Device Status Overview*\n\n';

    // Group devices by server
    const devicesByServer = new Map<string, Device[]>();
    devices.forEach(device => {
      if (!devicesByServer.has(device.server_id)) {
        devicesByServer.set(device.server_id, []);
      }
      devicesByServer.get(device.server_id)!.push(device);
    });

    // Build status message
    for (const [serverId, serverDevices] of devicesByServer) {
      const server = servers.find(s => s.id === serverId);
      const serverName = server?.name || serverId;
      const serverStatus = server?.status === 'online' ? '🟢' : '🔴';

      message += `${serverStatus} *${serverName}*\n`;

      serverDevices.forEach(device => {
        const icon = this.getStatusIcon(device.status);
        const timeSince = this.formatTimeSince(device.last_check);
        const displayName = device.name || device.serial;
        message += `  ${icon} *${displayName}* - ${device.status} (${timeSince})\n`;
      });

      message += '\n';
    }

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async handleServersCommand(chatId: number): Promise<void> {
    const servers = this.db.getAllServers();

    if (servers.length === 0) {
      this.bot.sendMessage(chatId, '⚠️ No servers registered yet.');
      return;
    }

    let message = '🖥️ *Registered Servers*\n\n';

    servers.forEach(server => {
      const statusIcon = server.status === 'online' ? '🟢' : '🔴';
      const devices = this.db.getDevicesByServer(server.id);
      const timeSince = this.formatTimeSince(server.last_seen);

      message += `${statusIcon} *${server.name}* (\`${server.id}\`)\n`;
      message += `   Status: ${server.status} | Devices: ${devices.length} | Last seen: ${timeSince}\n\n`;
    });

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async handleDevicesCommand(chatId: number, serverId?: string): Promise<void> {
    if (!serverId) {
      const servers = this.db.getAllServers();
      if (servers.length === 0) {
        this.bot.sendMessage(chatId, '⚠️ No servers registered.');
        return;
      }

      let message = '📱 Select a server:\n\n';
      servers.forEach(s => {
        message += `/devices ${s.id} - ${s.name}\n`;
      });

      this.bot.sendMessage(chatId, message);
      return;
    }

    const server = this.db.getServer(serverId);
    if (!server) {
      this.bot.sendMessage(chatId, `❌ Server '${serverId}' not found.`);
      return;
    }

    const devices = this.db.getDevicesByServer(serverId);

    if (devices.length === 0) {
      this.bot.sendMessage(chatId, `⚠️ No devices on server '${server.name}'.\n\nUse /scan ${serverId} to discover devices.`);
      return;
    }

    let message = `📱 *Devices on ${server.name}*\n\n`;

    devices.forEach(device => {
      const icon = this.getStatusIcon(device.status);
      const timeSince = this.formatTimeSince(device.last_check);
      message += `${icon} \`${device.serial}\`\n`;
      message += `   Status: ${device.status} | Checked: ${timeSince}\n\n`;
    });

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async handleAddCommand(chatId: number, args?: string): Promise<void> {
    if (!args) {
      this.bot.sendMessage(chatId, 'Usage: /add <serial> <server_id> [name]\n\nExample: /add ABC123 server-1 Phone-1');
      return;
    }

    const parts = args.split(/\s+/);
    const serial = parts[0];
    const serverId = parts[1];
    const name = parts.slice(2).join(' ');

    if (!serial || !serverId) {
      this.bot.sendMessage(chatId, '❌ Both serial and server_id are required.\n\nUsage: /add <serial> <server_id> [name]');
      return;
    }

    const server = this.db.getServer(serverId);
    if (!server) {
      this.bot.sendMessage(chatId, `❌ Server '${serverId}' not found.\n\nUse /servers to see available servers.`);
      return;
    }

    this.db.addDevice(serial, serverId, name || undefined);
    const displayName = name || serial;
    this.bot.sendMessage(chatId, `✓ Added device *${displayName}* (\`${serial}\`) to ${server.name}`, { parse_mode: 'Markdown' });
  }

  private async handleRemoveCommand(chatId: number, args?: string): Promise<void> {
    if (!args) {
      this.bot.sendMessage(chatId, 'Usage: /remove <serial> <server_id>\n\nExample: /remove ABC123 server-1');
      return;
    }

    const [serial, serverId] = args.split(/\s+/);

    if (!serial || !serverId) {
      this.bot.sendMessage(chatId, '❌ Both serial and server_id are required.\n\nUsage: /remove <serial> <server_id>');
      return;
    }

    const removed = this.db.removeDevice(serial, serverId);

    if (removed) {
      this.bot.sendMessage(chatId, `✓ Removed device \`${serial}\` from server`, { parse_mode: 'Markdown' });
    } else {
      this.bot.sendMessage(chatId, `❌ Device \`${serial}\` not found on server \`${serverId}\``, { parse_mode: 'Markdown' });
    }
  }

  private async handleStatsCommand(chatId: number): Promise<void> {
    const stats = this.db.getStats();

    const message = `
📈 *Overall Statistics*

🖥️ Servers: ${stats.servers}
📱 Total Devices: ${stats.devices}

*Device Status:*
🟢 Online: ${stats.online}
🔴 Offline: ${stats.offline}
⚠️ Unauthorized: ${stats.unauthorized}
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async handleScanCommand(chatId: number, serverId?: string): Promise<void> {
    this.bot.sendMessage(chatId, '⚠️ Scan command requires direct server access.\n\nThis feature will be available when the server exposes an API endpoint.');
  }

  private async handleRenameCommand(chatId: number, args?: string): Promise<void> {
    if (!args) {
      this.bot.sendMessage(chatId, 'Usage: /rename <serial> <server_id> <new_name>\n\nExample: /rename ABC123 server-1 Phone-1');
      return;
    }

    const parts = args.split(/\s+/);
    const serial = parts[0];
    const serverId = parts[1];
    const newName = parts.slice(2).join(' ');

    if (!serial || !serverId || !newName) {
      this.bot.sendMessage(chatId, '❌ Serial, server_id, and name are required.\n\nUsage: /rename <serial> <server_id> <new_name>');
      return;
    }

    const device = this.db.getDevice(serial, serverId);
    if (!device) {
      this.bot.sendMessage(chatId, `❌ Device \`${serial}\` not found on server \`${serverId}\``, { parse_mode: 'Markdown' });
      return;
    }

    this.db.setDeviceName(serial, serverId, newName);
    this.bot.sendMessage(chatId, `✓ Renamed device \`${serial}\` to *${newName}*`, { parse_mode: 'Markdown' });
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'unauthorized': return '⚠️';
      default: return '⚪';
    }
  }

  private formatTimeSince(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Send notification about status change
   */
  async notifyStatusChange(serial: string, serverId: string, oldStatus: string, newStatus: string): Promise<void> {
    const server = this.db.getServer(serverId);
    const serverName = server?.name || serverId;
    const device = this.db.getDevice(serial, serverId);
    const deviceName = device?.name || serial;

    const icon = this.getStatusIcon(newStatus);
    const urgency = newStatus === 'offline' || newStatus === 'unauthorized' ? '🚨 ALERT' : 'ℹ️ Notice';

    const message = `
${urgency} ${icon}

*${deviceName}* is now *${newStatus}*

📍 Server: ${serverName}
📱 Device: \`${serial}\`
📊 Status: ${oldStatus} → *${newStatus}*
🕐 Time: ${new Date().toLocaleString()}
    `.trim();

    for (const chatId of this.notificationChats) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Failed to send notification to ${chatId}:`, error);
      }
    }
  }

  /**
   * Start polling for unnotified status changes
   */
  startNotificationPolling(intervalMs: number = 5000): void {
    setInterval(() => {
      const changes = this.db.getUnnotifiedChanges();

      changes.forEach(change => {
        if (change.id) {
          this.notifyStatusChange(change.device_serial, change.server_id, change.old_status, change.new_status);
          this.db.markChangeAsNotified(change.id);
        }
      });
    }, intervalMs);
  }

  /**
   * Stop the bot
   */
  stop(): void {
    this.bot.stopPolling();
  }
}
