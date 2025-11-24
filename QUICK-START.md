# Quick Start Guide

Get your ADB Tracker Bot running in 5 minutes!

## Prerequisites Check

Before starting, verify you have:

- ✅ Node.js 18 or higher installed
- ✅ ADB (Android Debug Bridge) installed
- ✅ At least one Android device connected via USB
- ✅ A Telegram account

## Step 1: Create Your Telegram Bot (2 minutes)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` to BotFather
3. Choose a name (e.g., "My ADB Tracker")
4. Choose a username (e.g., "my_adb_tracker_bot")
5. Copy the **token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Save it for Step 3

## Step 2: Get Your Chat ID (1 minute)

1. Search for **@userinfobot** on Telegram
2. Send `/start`
3. Copy your **chat ID** (a number like: `123456789`)
4. Save it for Step 3

## Step 3: Install and Configure (1 minute)

```bash
# Navigate to the project folder
cd adb-tracker-bot

# Install dependencies
npm install

# Create configuration file
cp .env.example .env
```

Now edit `.env` and add your tokens:

```env
TELEGRAM_BOT_TOKEN=paste_your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=paste_your_chat_id_here
SERVER_ID=my-server
SERVER_NAME=My Server
CHECK_INTERVAL_SECONDS=30
MODE=standalone
```

## Step 4: Connect Your Devices (1 minute)

1. Connect your Android devices via USB
2. Enable **USB Debugging** on each device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
3. Accept the USB debugging prompt on each device

Verify devices are detected:

```bash
adb devices
```

You should see your devices listed like:
```
List of devices attached
ABC123      device
XYZ789      device
```

## Step 5: Run the Bot! (30 seconds)

```bash
npm run build
npm start
```

You should see:

```
🚀 ADB Tracker - Starting in standalone mode

🔍 Scanning for ADB devices...

Found 2 device(s):

  1. ✓ ABC123 - device
  2. ✓ XYZ789 - device

✓ Added device: ABC123
✓ Added device: XYZ789

🚀 Starting device monitor for My Server
   Check interval: 30s

🤖 Starting Telegram bot...

✓ Bot is running

✅ System fully operational!
```

## Step 6: Use the Bot

Open Telegram and find your bot:

1. Search for your bot username (e.g., @my_adb_tracker_bot)
2. Send `/start`
3. Try these commands:
   - `/status` - See all devices
   - `/notify` - Enable notifications
   - `/help` - See all commands

That's it! 🎉

## What Happens Next?

The bot will now:

- ✅ Check device status every 30 seconds
- ✅ Send you a Telegram message if a device goes offline
- ✅ Send you a message if a device becomes unauthorized
- ✅ Track status changes in the database

## Common First-Time Issues

### "adb: command not found"

**Fix:** Install Android SDK Platform Tools and add to PATH.

**Quick fix (Ubuntu/Debian):**
```bash
sudo apt install adb
```

**Quick fix (Mac with Homebrew):**
```bash
brew install android-platform-tools
```

**Windows:**
Download from: https://developer.android.com/studio/releases/platform-tools

### "No devices found"

**Fix:**
1. Check USB cables
2. Enable USB debugging on devices
3. Accept USB debugging prompt on devices
4. Try: `adb kill-server` then `adb devices`

### "Unauthorized device"

**Fix:**
1. Unplug and replug the USB cable
2. On the device, accept the "Allow USB debugging" prompt
3. Check "Always allow from this computer"

### Bot doesn't respond

**Fix:**
1. Check `TELEGRAM_BOT_TOKEN` is correct
2. Make sure bot is running (check console for errors)
3. Try `/start` in Telegram
4. Check your internet connection

## Testing the Notifications

Want to test if notifications work?

1. Send `/notify` to your bot
2. Unplug one of your devices
3. Wait up to 30 seconds (or whatever your CHECK_INTERVAL is)
4. You should get a notification: "🔴 Device Status Changed"

## Next Steps

Now that you have it running:

- 📖 Read [README.md](README.md) for all features
- 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) to run as a service
- 💡 Read [ADVANCED-USAGE.md](ADVANCED-USAGE.md) for multi-server setups

## Getting Help

If something isn't working:

1. Check the console output for errors
2. Verify your `.env` configuration
3. Make sure ADB is working: `adb devices`
4. Check that your bot token is valid
5. Review the troubleshooting section in README.md

## Quick Commands Reference

```bash
# Start the bot
npm start

# Stop the bot
Ctrl+C

# View status
# (Use Telegram /status command)

# Rebuild after code changes
npm run build

# Run in development mode
npm run dev
```

Enjoy your ADB Tracker Bot! 🤖📱
