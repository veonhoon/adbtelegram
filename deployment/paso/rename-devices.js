// Device naming script for server paso
const Database = require('better-sqlite3');
const db = new Database('./adb_tracker.db');

const phoneMapping = {
  "19041FDF6001GE": "Phone-96",
  "19161FDF6008F8": "Phone-97",
  "23081FDF6S0RDP": "Phone-98",
  "28221FDH2008D8": "Phone-99",
  "28231FDH20068Z": "Phone-100",
  "28231FDH2006C2": "Phone-101",
  "29171FDH200C4E": "Phone-102",
  "29291FDH200G9U": "Phone-103",
  "2A171FDH20046R": "Phone-104",
  "2B231FDH200KEL": "Phone-105",
  "29201FDH2007RP": "Phone-107",
  "2B301FDH200D06": "Phone-108",
  "28291FDH2001BV": "Phone-109",
  "2B261FDH2000QT": "Phone-110",
  "2C021FDH2007D5": "Phone-111",
  "2B231FDH20051A": "Phone-112",
  "2A131FDH200AX1": "Phone-113",
  "29221FDH200MYT": "Phone-114",
  "28031FDH200DKD": "Phone-115",
  "R5CY22LCMLW": "Phone-118",
  "R5CY34RAFFX": "Phone-119",
  "R5CY34RAH7Z": "Phone-120",
  "R5CY34RB48Y": "Phone-121",
  "R5CY42EVWAB": "Phone-122"
};

console.log('🔄 Renaming devices on server paso...\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');
let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, 'paso');
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
console.log(`   Expected: 24 phones`);

db.close();
