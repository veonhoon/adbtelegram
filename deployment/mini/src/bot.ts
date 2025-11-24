import dotenv from 'dotenv';
import { ADBDatabase } from './database';
import { ADBTelegramBot } from './telegram-bot';

dotenv.config();

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const dbPath = process.env.DB_PATH || './adb_tracker.db';

  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required in .env file');
    process.exit(1);
  }

  console.log('🤖 Starting ADB Tracker Telegram Bot...\n');
  console.log(`📁 Database: ${dbPath}\n`);

  const db = new ADBDatabase(dbPath);
  const bot = new ADBTelegramBot({
    token: botToken,
    database: db,
    adminChatId
  });

  // Start notification polling
  bot.startNotificationPolling(5000);

  console.log('✓ Bot is running and listening for commands');
  console.log('✓ Notification polling started\n');

  if (adminChatId) {
    console.log(`📱 Admin chat ID: ${adminChatId}`);
  } else {
    console.log('💡 Set TELEGRAM_ADMIN_CHAT_ID in .env to enable default notifications');
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Shutting down bot...');
    bot.stop();
    db.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    bot.stop();
    db.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
