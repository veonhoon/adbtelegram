# PASO Server Deployment

## Expected Phones: 24

- Phone-96
- Phone-97
- Phone-98
- Phone-99
- Phone-100
- Phone-101
- Phone-102
- Phone-103
- Phone-104
- Phone-105
- Phone-107
- Phone-108
- Phone-109
- Phone-110
- Phone-111
- Phone-112
- Phone-113
- Phone-114
- Phone-115
- Phone-118
- Phone-119
- Phone-120
- Phone-121
- Phone-122

## Deployment Steps

1. Copy this entire folder to the paso server
2. Update .env DB_PATH to point to lulu server
3. Run: `deploy-paso.bat`
4. Check the output for renamed devices


## Database Connection

Make sure you can access:
`\\lulu\ADBTracker\adb_tracker.db`

Test with: `dir \\lulu\ADBTracker`

