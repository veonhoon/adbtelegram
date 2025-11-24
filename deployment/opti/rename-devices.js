// Device naming script for server opti
const Database = require('better-sqlite3');
const db = new Database('./adb_tracker.db');

const phoneMapping = {
  "25311JEGR21901": "Phone-5",
  "26061JEGR04204": "Phone-6",
  "26221JEGR30826": "Phone-7",
  "27051JEGR12956": "Phone-10",
  "27071JEGR22179": "Phone-11",
  "27151JEGR14372": "Phone-12",
  "29081JEGR10618": "Phone-13",
  "24221FDF600ANF": "Phone-19",
  "18151FDF6001CH": "Phone-21",
  "18261FDF60058X": "Phone-22",
  "25191FDF6003YD": "Phone-23",
  "21121FDF600851": "Phone-24",
  "26111FDF6006KA": "Phone-25",
  "19251FDF6003AD": "Phone-28",
  "19141FDF6005L5": "Phone-29",
  "24231FDF6002U5": "Phone-31",
  "25131FDF6002BP": "Phone-32",
  "18281FDF6002J8": "Phone-33",
  "19261FDF6003AV": "Phone-34",
  "1B101FDF6002V4": "Phone-35",
  "1C021FDF600GL5": "Phone-36",
  "22271FDF60011S": "Phone-37",
  "09301JECB29760": "Phone-40",
  "0A201JECB03540": "Phone-42",
  "0C081JECB01802": "Phone-45",
  "18181FDF6004BJ": "Phone-52",
  "19171FDF600DFB": "Phone-63",
  "23221FDF60021W": "Phone-64",
  "19251FDF6007SB": "Phone-65"
};

console.log('🔄 Renaming devices on server opti...\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');
let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, 'opti');
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
console.log(`   Expected: 29 phones`);

db.close();
