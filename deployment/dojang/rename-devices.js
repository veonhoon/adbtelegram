// Device naming script for server dojang
const Database = require('better-sqlite3');
const db = new Database('./adb_tracker.db');

const phoneMapping = {
  "22111FDF60015D": "Phone-54",
  "1A121JEG503263": "Phone-56",
  "18061JECB03577": "Phone-61",
  "1A051FDF600D1U": "Phone-66",
  "19121FDF6002N2": "Phone-71",
  "19111FDF600DUE": "Phone-72",
  "1A141FDF6007JP": "Phone-73",
  "1B161FDF6003AJ": "Phone-75",
  "1B231FDF600CK3": "Phone-77",
  "18261FDF6004HK": "Phone-95",
  "28281FDH2001R7": "Phone-106",
  "17271JECB09467": "Phone-117"
};

console.log('🔄 Renaming devices on server dojang...\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');
let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, 'dojang');
  if (result.changes > 0) {
    console.log(`✓ ${serial} → ${phoneName}`);
    renamed++;
  } else {
    console.log(`✗ ${phoneName} (${serial}) - NOT FOUND`);
    notFound++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Renamed: ${renamed}`);
console.log(`   Missing/Offline: ${notFound}`);
console.log(`   Expected: 13 phones`);

db.close();
