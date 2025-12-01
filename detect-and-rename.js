// Auto-detect devices and create rename script
const { execSync } = require('child_process');
const fs = require('fs');

const serverId = process.argv[2];
if (!serverId) {
  console.error('Usage: node detect-and-rename.js <server_id>');
  process.exit(1);
}

console.log(`🔍 Detecting devices for server: ${serverId}\n`);

// Read phone-mappings.json
const phoneMappings = JSON.parse(fs.readFileSync('phone-mappings.json', 'utf8'));
const expectedPhones = phoneMappings[serverId] || [];

console.log(`Expected ${expectedPhones.length} phones for ${serverId}:`, expectedPhones.join(', '));
console.log();

// Get connected ADB devices
let adbOutput;
try {
  adbOutput = execSync('adb devices -l', { encoding: 'utf8' });
} catch (error) {
  console.error('ERROR: Failed to run adb devices');
  process.exit(1);
}

// Parse connected devices
const lines = adbOutput.split('\n').slice(1);
const connectedSerials = [];

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && trimmed.includes('device')) {
    const serial = trimmed.split(/\s+/)[0];
    if (serial && serial.length > 5) {
      connectedSerials.push(serial);
    }
  }
});

console.log(`Found ${connectedSerials.length} connected devices\n`);

// Create mapping from connected serials to phone numbers
// We need to match the serials we found to the phone numbers expected for this server
const phoneMapping = {};

connectedSerials.forEach(serial => {
  // For each connected serial, we need to figure out which Phone-X it is
  // Since we don't have the pre-existing mapping, we'll create it as UNKNOWN for now
  // and let the user see what's connected
  phoneMapping[serial] = `Phone-DETECTED-${serial.substring(0, 6)}`;
});

// Generate rename-devices.js
const renameScript = `// Device naming script for server ${serverId}
const Database = require('better-sqlite3');

const db = new Database('./adb_tracker.db');

// Phone mapping for server ${serverId}
const phoneMapping = ${JSON.stringify(phoneMapping, null, 2)};

console.log('🔄 Renaming devices on server ${serverId}...\\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');

let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, '${serverId}');
  if (result.changes > 0) {
    console.log(\`✓ \${serial} → \${phoneName}\`);
    renamed++;
  } else {
    console.log(\`✗ \${phoneName} (\${serial}) - NOT FOUND (offline or not connected)\`);
    notFound++;
  }
}

console.log(\`\\n📊 Summary:\`);
console.log(\`   Renamed: \${renamed}\`);
console.log(\`   Missing/Offline: \${notFound}\`);
console.log(\`   Expected: ${expectedPhones.length} phones\`);
console.log(\`   Currently online: \${renamed} phones\`);

db.close();
`;

fs.writeFileSync('rename-devices.js', renameScript);
console.log('✓ Created rename-devices.js');
console.log(`✓ Detected ${Object.keys(phoneMapping).length} devices to track\n`);
