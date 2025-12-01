import dotenv from 'dotenv';
import { ADBDatabase } from './database';
import { DeviceMonitor } from './monitor';
import { ADBTelegramBot } from './telegram-bot';

dotenv.config();

/**
 * Main entry point - runs both monitor and bot in standalone mode
 */
async function main() {
  const mode = process.env.MODE || 'standalone';
  const serverId = process.env.SERVER_ID || 'server-1';
  const serverName = process.env.SERVER_NAME || 'Main Server';
  const healthUrl = process.env.SERVER_HEALTH_URL;
  const checkInterval = parseInt(process.env.CHECK_INTERVAL_SECONDS || '30');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const dbPath = process.env.DB_PATH || './adb_tracker.db';

  console.log('🚀 ADB Tracker - Starting in', mode, 'mode\n');
  console.log(`📁 Database: ${dbPath}\n`);

  const db = new ADBDatabase(dbPath);

  if (mode === 'standalone') {
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN is required for standalone mode');
      process.exit(1);
    }

    // Start the monitor
    const monitor = new DeviceMonitor({
      serverId,
      serverName,
      checkIntervalSeconds: checkInterval,
      database: db,
      healthUrl
    });

    await monitor.initialize();

    // Check for existing devices
    const trackedDevices = db.getDevicesByServer(serverId);

    if (trackedDevices.length === 0) {
      console.log('⚙️  No devices tracked. Running discovery...\n');
      const discovered = await monitor.discoverDevices();

      if (discovered.length > 0) {
        console.log('\n📝 Adding all discovered devices to tracking...\n');
        monitor.addDevicesToTracking(discovered);
      }
    } else {
      console.log(`✓ Tracking ${trackedDevices.length} device(s):`);
      trackedDevices.forEach(d => console.log(`  - ${d.serial}`));
    }

    // Start monitoring
    await monitor.start();

    // Start Telegram bot
    console.log('\n🤖 Starting Telegram bot...\n');
    const bot = new ADBTelegramBot({
      token: botToken,
      database: db,
      adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID
    });

    bot.startNotificationPolling(5000);
    bot.startServerHealthChecks(30000);
    console.log('✓ Bot is running\n');
    console.log('✓ Server health monitoring enabled\n');

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n\n⏹️  Shutting down...');
      monitor.stop();
      bot.stop();
      db.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('✅ System fully operational!\n');
    console.log('💡 Use /help in Telegram to see available commands\n');

  } else if (mode === 'agent') {
    // Agent mode - only runs monitor, reports to central bot
    console.log('📡 Running in agent mode (monitor only)\n');

    const monitor = new DeviceMonitor({
      serverId,
      serverName,
      checkIntervalSeconds: checkInterval,
      database: db
    });

    await monitor.initialize();

    const trackedDevices = db.getDevicesByServer(serverId);

    if (trackedDevices.length === 0) {
      const discovered = await monitor.discoverDevices();
      if (discovered.length > 0) {
        monitor.addDevicesToTracking(discovered);
      }
    }

    await monitor.start();

    const shutdown = () => {
      console.log('\n\n⏹️  Shutting down...');
      monitor.stop();
      db.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } else {
    console.error(`❌ Unknown mode: ${mode}`);
    console.error('Valid modes: standalone, agent');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
