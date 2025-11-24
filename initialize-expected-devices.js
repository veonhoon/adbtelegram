/**
 * Initialize database with all expected devices from phone-mappings.json
 * This ensures we can track offline phones that have never been connected
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Load phone mappings
const mappingsPath = path.join(__dirname, 'phone-mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

// Database path
const dbPath = process.env.DB_PATH || './adb_tracker.db';
const db = new Database(dbPath);

console.log('📋 Initializing expected devices from phone-mappings.json\n');
console.log(`📁 Database: ${dbPath}\n`);

// Get all existing devices
const existingDevices = db.prepare('SELECT serial, server_id, name FROM devices').all();
const existingMap = new Map();
existingDevices.forEach(d => {
  existingMap.set(`${d.server_id}:${d.name}`, d.serial);
});

// Get existing servers
const existingServers = db.prepare('SELECT id FROM servers').all();
const serverIds = new Set(existingServers.map(s => s.id));

let addedCount = 0;
let skippedCount = 0;

// For each server, check if all expected phones exist
for (const [serverId, phoneNumbers] of Object.entries(mappings)) {
  // Skip if server doesn't exist yet
  if (!serverIds.has(serverId)) {
    console.log(`\n⏭️  ${serverId.toUpperCase()}: Server not registered yet, skipping`);
    continue;
  }
  console.log(`\n📱 ${serverId.toUpperCase()}: Checking ${phoneNumbers.length} expected phones`);

  phoneNumbers.forEach(phoneNum => {
    const phoneName = `Phone-${phoneNum}`;
    const key = `${serverId}:${phoneName}`;

    if (existingMap.has(key)) {
      skippedCount++;
      console.log(`  ✓ ${phoneName} already exists`);
    } else {
      // Add as offline with placeholder serial
      const placeholderSerial = `UNKNOWN_${serverId}_${phoneNum}`;

      db.prepare(`
        INSERT INTO devices (serial, server_id, name, status, last_status, last_check, added_at)
        VALUES (?, ?, ?, 'offline', 'offline', ?, ?)
      `).run(
        placeholderSerial,
        serverId,
        phoneName,
        Date.now(),
        Date.now()
      );

      addedCount++;
      console.log(`  + ${phoneName} added as offline (will update when connected)`);
    }
  });
}

db.close();

console.log('\n' + '='.repeat(50));
console.log(`✅ Initialization complete!`);
console.log(`   Added: ${addedCount} devices`);
console.log(`   Skipped: ${skippedCount} devices (already exist)`);
console.log('='.repeat(50));
console.log('\n💡 Restart the bot to see all expected devices\n');
