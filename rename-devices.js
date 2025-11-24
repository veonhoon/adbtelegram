// Device naming script for server lulu
const Database = require('better-sqlite3');

const db = new Database('./adb_tracker.db');

// Phone mapping for server lulu
const phoneMapping = {
  '24201JEGR01400': 'Phone-1',
  '25121JEGR16668': 'Phone-2',
  '25211JEGR02696': 'Phone-3',
  '25311JEGR11043': 'Phone-4',
  '26231JEGR03006': 'Phone-8',
  '26241JEGR03390': 'Phone-9',
  '2A071JEGR19653': 'Phone-14',
  '2B291JEGR05305': 'Phone-15',
  '36161JEGR00940': 'Phone-16',
  '26071JEGR05499': 'Phone-17',
  '19231FDF6009Z2': 'Phone-30',
  '0A101JECB27855': 'Phone-46',
  '0B141JECB09953': 'Phone-48',
  '13291JECB08024': 'Phone-50',
  '26141FDF6005GJ': 'Phone-67',
  '23131FDF6000JY': 'Phone-69',
  '19241FDF6000AS': 'Phone-74',
  '1B231FDF600CK3': 'Phone-76',
  '19031FDF600FJU': 'Phone-78',
  '19131FDF6009XZ': 'Phone-79',
  '19141FDF600BFM': 'Phone-80',
  '25311FDF600AJA': 'Phone-81',
  '1C311FDF60005K': 'Phone-82',
  '1C101FDF600HJS': 'Phone-83',
  '19171FDF6008K8': 'Phone-84',
  '23211FDF6S0S5Q': 'Phone-85',
  '1B251FDF60079B': 'Phone-86',
  '1C111FDF600DZT': 'Phone-88',
  '23021FDF600642': 'Phone-91',
  '19291FDF6005U0': 'Phone-92',
  '1C091FDF6003AR': 'Phone-93'
};

console.log('🔄 Renaming devices on server lulu...\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');

let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, 'lulu');
  if (result.changes > 0) {
    console.log(`✓ ${serial} → ${phoneName}`);
    renamed++;
  } else {
    console.log(`✗ ${phoneName} (${serial}) - NOT FOUND (offline or not connected)`);
    notFound++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Renamed: ${renamed}`);
console.log(`   Missing/Offline: ${notFound}`);
console.log(`   Expected: 31 phones`);
console.log(`   Currently online: ${renamed} phones`);

db.close();
