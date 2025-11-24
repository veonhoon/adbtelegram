// Device naming script for server mini
const Database = require('better-sqlite3');
const db = new Database('./adb_tracker.db');

const phoneMapping = {
  "28211JEGR04320": "Phone-18",
  "1A271FDF600BSK": "Phone-38",
  "23021FDF60034U": "Phone-39",
  "0A031JECB04482": "Phone-41",
  "0B011JECB03102": "Phone-43",
  "09301JECB28948": "Phone-44",
  "0C021JECB06965": "Phone-49",
  "0B071JECB07166": "Phone-51",
  "17211JECB12085": "Phone-55",
  "1A261JEG502978": "Phone-57",
  "1A071FDF6000EG": "Phone-58",
  "25241FDF600BR2": "Phone-60",
  "1A281JEG502909": "Phone-62",
  "1C111FDF60024T": "Phone-68",
  "1A041FDF6002GN": "Phone-70",
  "19051FDF60048A": "Phone-87",
  "1B271FDF6008HK": "Phone-89",
  "25111FDF600DTH": "Phone-90",
  "23041FDF6002VL": "Phone-94"
};

console.log('🔄 Renaming devices on server mini...\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');
let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, 'mini');
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
console.log(`   Expected: 19 phones`);

db.close();
