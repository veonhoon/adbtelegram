# DOJANG Server Deployment

## Expected Phones: 13

- Phone-27
- Phone-54
- Phone-56
- Phone-61
- Phone-66
- Phone-71
- Phone-72
- Phone-73
- Phone-75
- Phone-77
- Phone-95
- Phone-106
- Phone-117

## Deployment Steps

1. Copy this entire folder to the dojang server
2. Update .env DB_PATH to point to lulu server
3. Run: `deploy-dojang.bat`
4. Check the output for renamed devices


## Database Connection

Make sure you can access:
`\\lulu\ADBTracker\adb_tracker.db`

Test with: `dir \\lulu\ADBTracker`

