// Generate deployment files for all servers
const fs = require('fs');

// Full phone to serial mapping
const phoneSerials = {
  1: '24201JEGR01400', 2: '25121JEGR16668', 3: '25211JEGR02696', 4: '25311JEGR11043',
  5: '25311JEGR21901', 6: '26061JEGR04204', 7: '26221JEGR30826', 8: '26231JEGR03006',
  9: '26241JEGR03390', 10: '27051JEGR12956', 11: '27071JEGR22179', 12: '27151JEGR14372',
  13: '29081JEGR10618', 14: '2A071JEGR19653', 15: '2B291JEGR05305', 16: '36161JEGR00940',
  17: '26071JEGR05499', 18: '28211JEGR04320', 19: '24221FDF600ANF', 21: '18151FDF6001CH',
  22: '18261FDF60058X', 23: '25191FDF6003YD', 24: '21121FDF600851', 25: '26111FDF6006KA',
  28: '19251FDF6003AD', 29: '19141FDF6005L5', 30: '19231FDF6009Z2', 31: '24231FDF6002U5',
  32: '25131FDF6002BP', 33: '18281FDF6002J8', 34: '19261FDF6003AV', 35: '1B101FDF6002V4',
  36: '1C021FDF600GL5', 37: '22271FDF60011S', 38: '1A271FDF600BSK', 39: '23021FDF60034U',
  40: '09301JECB29760', 41: '0A031JECB04482', 42: '0A201JECB03540', 43: '0B011JECB03102',
  44: '09301JECB28948', 45: '0C081JECB01802', 46: '0A101JECB27855', 48: '0B141JECB09953',
  49: '0C021JECB06965', 50: '13291JECB08024', 51: '0B071JECB07166', 52: '18181FDF6004BJ',
  54: '22111FDF60015D', 55: '17211JECB12085', 56: '1A121JEG503263', 57: '1A261JEG502978',
  58: '1A071FDF6000EG', 60: '25241FDF600BR2', 61: '18061JECB03577', 62: '1A281JEG502909',
  63: '19171FDF600DFB', 64: '23221FDF60021W', 65: '19251FDF6007SB', 66: '1A051FDF600D1U',
  67: '26141FDF6005GJ', 68: '1C111FDF60024T', 69: '23131FDF6000JY', 70: '1A041FDF6002GN',
  71: '19121FDF6002N2', 72: '19111FDF600DUE', 73: '1A141FDF6007JP', 74: '19241FDF6000AS',
  75: '1B161FDF6003AJ', 76: '1B231FDF600CK3', 77: '1B231FDF600CK3', 78: '19031FDF600FJU',
  79: '19131FDF6009XZ', 80: '19141FDF600BFM', 81: '25311FDF600AJA', 82: '1C311FDF60005K',
  83: '1C101FDF600HJS', 84: '19171FDF6008K8', 85: '23211FDF6S0S5Q', 86: '1B251FDF60079B',
  87: '19051FDF60048A', 88: '1C111FDF600DZT', 89: '1B271FDF6008HK', 90: '25111FDF600DTH',
  91: '23021FDF600642', 92: '19291FDF6005U0', 93: '1C091FDF6003AR', 94: '23041FDF6002VL',
  95: '18261FDF6004HK', 96: '19041FDF6001GE', 97: '19161FDF6008F8', 98: '23081FDF6S0RDP',
  99: '28221FDH2008D8', 100: '28231FDH20068Z', 101: '28231FDH2006C2', 102: '29171FDH200C4E',
  103: '29291FDH200G9U', 104: '2A171FDH20046R', 105: '2B231FDH200KEL', 106: '28281FDH2001R7',
  107: '29201FDH2007RP', 108: '2B301FDH200D06', 109: '28291FDH2001BV', 110: '2B261FDH2000QT',
  111: '2C021FDH2007D5', 112: '2B231FDH20051A', 113: '2A131FDH200AX1', 114: '29221FDH200MYT',
  115: '28031FDH200DKD', 117: '17271JECB09467', 118: 'R5CY22LCMLW', 119: 'R5CY34RAFFX',
  120: 'R5CY34RAH7Z', 121: 'R5CY34RB48Y', 122: 'R5CY42EVWAB'
};

const serverMappings = require('./phone-mappings.json');

// Create deployment folder
if (!fs.existsSync('./deployment')) {
  fs.mkdirSync('./deployment');
}

for (const [serverName, phoneNumbers] of Object.entries(serverMappings)) {
  const serverDir = `./deployment/${serverName}`;
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }

  // Create phone mapping for this server
  const mapping = {};
  phoneNumbers.forEach(num => {
    const serial = phoneSerials[num];
    if (serial) {
      mapping[serial] = `Phone-${num}`;
    }
  });

  // Generate rename script
  const renameScript = `// Device naming script for server ${serverName}
const Database = require('better-sqlite3');
const db = new Database('./adb_tracker.db');

const phoneMapping = ${JSON.stringify(mapping, null, 2)};

console.log('🔄 Renaming devices on server ${serverName}...\\n');

const stmt = db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');
let renamed = 0;
let notFound = 0;

for (const [serial, phoneName] of Object.entries(phoneMapping)) {
  const result = stmt.run(phoneName, serial, '${serverName}');
  if (result.changes > 0) {
    console.log(\`✓ \${serial} → \${phoneName}\`);
    renamed++;
  } else {
    console.log(\`✗ \${phoneName} (\${serial}) - NOT FOUND\`);
    notFound++;
  }
}

console.log(\`\\n📊 Summary:\`);
console.log(\`   Renamed: \${renamed}\`);
console.log(\`   Missing/Offline: \${notFound}\`);
console.log(\`   Expected: ${phoneNumbers.length} phones\`);

db.close();
`;

  fs.writeFileSync(`${serverDir}/rename-devices.js`, renameScript);

  // Create .env for agent mode (except lulu)
  const isMain = serverName === 'lulu';
  const envContent = isMain ?
`# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8580518121:AAHCWEa64fcl23PGUmQBzfOcuPpQ4FxQo7E
TELEGRAM_ADMIN_CHAT_ID=

# Server Configuration
SERVER_ID=${serverName}
SERVER_NAME=${serverName.charAt(0).toUpperCase() + serverName.slice(1)}

# Monitoring
CHECK_INTERVAL_SECONDS=30

# Database (local on main server)
DB_PATH=

# Mode (standalone = bot + monitor)
MODE=standalone
` :
`# Server Configuration
SERVER_ID=${serverName}
SERVER_NAME=${serverName.charAt(0).toUpperCase() + serverName.slice(1)}

# Monitoring
CHECK_INTERVAL_SECONDS=30

# Database (shared from lulu server)
# IMPORTANT: Update this path to point to lulu's shared database
DB_PATH=\\\\\\\\lulu\\\\ADBTracker\\\\adb_tracker.db

# Mode (agent = monitor only, no bot)
MODE=agent
`;

  fs.writeFileSync(`${serverDir}/.env`, envContent);

  // Create deployment BAT file
  const batContent = `@echo off
echo ═══════════════════════════════════════
echo   ADB Tracker - ${serverName.toUpperCase()} Setup
echo ═══════════════════════════════════════
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Install from nodejs.org
    pause
    exit /b 1
)

REM Check ADB
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ADB not found! Install Android Platform Tools
    pause
    exit /b 1
)

echo ✓ Prerequisites OK
echo.

REM Install and build (if needed)
if not exist "node_modules" (
    echo → Installing dependencies...
    call npm install
)

if not exist "dist" (
    echo → Building project...
    call npm run build
)

echo.
echo → Running device rename script...
node rename-devices.js
echo.

echo ═══════════════════════════════════════
echo   Starting ${serverName.toUpperCase()} Monitor
echo ═══════════════════════════════════════
echo.

${isMain ? 'echo This is the MAIN server - Bot + Monitor' : 'echo This is an AGENT server - Monitor only'}
echo Press Ctrl+C to stop
echo.

npm start
`;

  fs.writeFileSync(`${serverDir}/deploy-${serverName}.bat`, batContent);

  // Create README for this server
  const readmeContent = `# ${serverName.toUpperCase()} Server Deployment

## Expected Phones: ${phoneNumbers.length}

${phoneNumbers.map(n => `- Phone-${n}`).join('\n')}

## Deployment Steps

1. Copy this entire folder to the ${serverName} server
2. ${isMain ? 'This is the MAIN server - it runs the Telegram bot' : 'Update .env DB_PATH to point to lulu server'}
3. Run: \`deploy-${serverName}.bat\`
4. Check the output for renamed devices

${isMain ? `
## Sharing Database (REQUIRED for multi-server)

1. Create folder: C:\\ADBTracker
2. Share it on network as "ADBTracker"
3. Grant Full Control to all server computers
4. The database file will be at: C:\\ADBTracker\\adb_tracker.db
` : `
## Database Connection

Make sure you can access:
\`\\\\lulu\\ADBTracker\\adb_tracker.db\`

Test with: \`dir \\\\lulu\\ADBTracker\`
`}
`;

  fs.writeFileSync(`${serverDir}/README.md`, readmeContent);

  console.log(`✓ Generated deployment for ${serverName} (${phoneNumbers.length} phones)`);
}

console.log('\n✅ All deployment packages created in ./deployment/');
console.log('\nNext steps:');
console.log('1. Share C:\\ADBTracker on lulu server');
console.log('2. Copy each folder to its respective server');
console.log('3. Run deploy-{server}.bat on each server');
