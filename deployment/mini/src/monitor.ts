import { ADBMonitor } from './adb-monitor';
import { ADBDatabase } from './database';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

export interface MonitorConfig {
  serverId: string;
  serverName: string;
  checkIntervalSeconds: number;
  database: ADBDatabase;
  onStatusChange?: (serial: string, oldStatus: string, newStatus: string) => void;
}

export class DeviceMonitor {
  private adbMonitor: ADBMonitor;
  private db: ADBDatabase;
  private config: MonitorConfig;
  private cronJob?: cron.ScheduledTask;
  private isRunning: boolean = false;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.adbMonitor = new ADBMonitor();
    this.db = config.database;
  }

  /**
   * Initialize the server in database
   */
  async initialize(): Promise<void> {
    this.db.upsertServer(this.config.serverId, this.config.serverName, 'online');
    console.log(`✓ Server registered: ${this.config.serverName} (${this.config.serverId})`);
  }

  /**
   * Perform initial device discovery and prompt user
   */
  async discoverDevices(): Promise<string[]> {
    console.log('\n🔍 Scanning for ADB devices...\n');

    const adbAvailable = await this.adbMonitor.isADBAvailable();
    if (!adbAvailable) {
      console.error('❌ ADB is not available on this system!');
      console.error('Please install Android SDK Platform Tools and ensure adb is in PATH');
      return [];
    }

    const devices = await this.adbMonitor.getConnectedDevices();

    if (devices.length === 0) {
      console.log('⚠️  No ADB devices found connected to this server.');
      console.log('Please connect your devices and run the discovery again.');
      return [];
    }

    console.log(`Found ${devices.length} device(s):\n`);
    devices.forEach((device, index) => {
      const statusIcon = device.status === 'device' ? '✓' : '✗';
      console.log(`  ${index + 1}. ${statusIcon} ${device.serial} - ${device.status}${device.model ? ` (${device.model})` : ''}`);
    });

    return devices.map(d => d.serial);
  }

  /**
   * Add devices to tracking
   */
  addDevicesToTracking(serials: string[]): void {
    serials.forEach(serial => {
      this.db.addDevice(serial, this.config.serverId);
      console.log(`✓ Added device: ${serial}`);
    });
  }

  /**
   * Start monitoring devices
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running');
      return;
    }

    console.log(`\n🚀 Starting device monitor for ${this.config.serverName}`);
    console.log(`   Check interval: ${this.config.checkIntervalSeconds}s\n`);

    // Do initial check
    await this.checkDevices();

    // Schedule periodic checks
    const cronExpression = `*/${this.config.checkIntervalSeconds} * * * * *`;
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.checkDevices();
    });

    this.isRunning = true;
    this.db.updateServerStatus(this.config.serverId, 'online');
  }

  /**
   * Check all tracked devices
   */
  private async checkDevices(): Promise<void> {
    const trackedDevices = this.db.getDevicesByServer(this.config.serverId);

    if (trackedDevices.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] Checking ${trackedDevices.length} device(s)...`);

    for (const device of trackedDevices) {
      const currentStatus = await this.adbMonitor.getDeviceStatus(device.serial);
      const statusChanged = this.db.updateDeviceStatus(device.serial, this.config.serverId, currentStatus);

      if (statusChanged) {
        const oldStatus = device.status;
        console.log(`  ⚠️  ${device.serial}: ${oldStatus} → ${currentStatus}`);

        if (this.config.onStatusChange) {
          this.config.onStatusChange(device.serial, oldStatus, currentStatus);
        }
      }
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
    }
    this.isRunning = false;
    this.db.updateServerStatus(this.config.serverId, 'offline');
    console.log('🛑 Monitor stopped');
  }

  /**
   * Get current monitoring status
   */
  getStatus(): { running: boolean; deviceCount: number; serverInfo: any } {
    const devices = this.db.getDevicesByServer(this.config.serverId);
    const server = this.db.getServer(this.config.serverId);

    return {
      running: this.isRunning,
      deviceCount: devices.length,
      serverInfo: server
    };
  }

  /**
   * Force a device check now
   */
  async checkNow(): Promise<void> {
    await this.checkDevices();
  }
}

// Standalone monitor script
if (require.main === module) {
  const serverId = process.env.SERVER_ID || 'server-1';
  const serverName = process.env.SERVER_NAME || 'Main Server';
  const checkInterval = parseInt(process.env.CHECK_INTERVAL_SECONDS || '30');

  const db = new ADBDatabase();
  const monitor = new DeviceMonitor({
    serverId,
    serverName,
    checkIntervalSeconds: checkInterval,
    database: db,
    onStatusChange: (serial, oldStatus, newStatus) => {
      console.log(`📢 Status change: ${serial} (${oldStatus} → ${newStatus})`);
    }
  });

  async function main() {
    await monitor.initialize();

    // Check if devices are already being tracked
    const trackedDevices = db.getDevicesByServer(serverId);

    if (trackedDevices.length === 0) {
      console.log('\n⚙️  No devices are currently being tracked on this server.');
      console.log('Starting device discovery...\n');

      const discoveredSerials = await monitor.discoverDevices();

      if (discoveredSerials.length > 0) {
        console.log('\n📝 Add all discovered devices to tracking? (Edit .env and restart to change)');
        monitor.addDevicesToTracking(discoveredSerials);
      } else {
        console.log('\n💡 You can manually add devices later using the Telegram bot commands.');
      }
    } else {
      console.log(`\n✓ Tracking ${trackedDevices.length} device(s) on this server:`);
      trackedDevices.forEach(d => console.log(`  - ${d.serial}`));
    }

    await monitor.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  Shutting down...');
      monitor.stop();
      db.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      monitor.stop();
      db.close();
      process.exit(0);
    });
  }

  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
