# OPTI Server Deployment

## Expected Phones: 29

- Phone-5
- Phone-6
- Phone-7
- Phone-10
- Phone-11
- Phone-12
- Phone-13
- Phone-19
- Phone-21
- Phone-22
- Phone-23
- Phone-24
- Phone-25
- Phone-28
- Phone-29
- Phone-31
- Phone-32
- Phone-33
- Phone-34
- Phone-35
- Phone-36
- Phone-37
- Phone-40
- Phone-42
- Phone-45
- Phone-52
- Phone-63
- Phone-64
- Phone-65

## Deployment Steps

1. Copy this entire folder to the opti server
2. Update .env DB_PATH to point to lulu server
3. Run: `deploy-opti.bat`
4. Check the output for renamed devices


## Database Connection

Make sure you can access:
`\\lulu\ADBTracker\adb_tracker.db`

Test with: `dir \\lulu\ADBTracker`

