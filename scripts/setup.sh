#!/bin/bash

# ADB Tracker Bot - Quick Setup Script
# This script helps you set up the bot quickly

set -e  # Exit on error

echo "╔════════════════════════════════════════╗"
echo "║   ADB Tracker Bot - Quick Setup        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "→ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old!"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Check ADB
echo "→ Checking ADB..."
if ! command -v adb &> /dev/null; then
    echo "❌ ADB is not installed!"
    echo ""
    echo "Please install Android SDK Platform Tools:"
    echo "  • Ubuntu/Debian: sudo apt install adb"
    echo "  • macOS: brew install android-platform-tools"
    echo "  • Windows: Download from https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

echo "✓ ADB found: $(adb version | head -n1)"

# Check for connected devices
echo "→ Checking for connected devices..."
DEVICE_COUNT=$(adb devices | grep -c "device$" || true)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "⚠️  No ADB devices connected"
    echo "Please connect your devices and enable USB debugging"
else
    echo "✓ Found $DEVICE_COUNT device(s) connected"
fi

# Install dependencies
echo ""
echo "→ Installing Node.js dependencies..."
npm install

# Setup .env
echo ""
echo "→ Setting up configuration..."

if [ -f .env ]; then
    echo "⚠️  .env file already exists, skipping..."
else
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 IMPORTANT: Configure your .env file"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "You need to add your Telegram bot credentials:"
    echo ""
    echo "1. Create a bot with @BotFather on Telegram"
    echo "2. Get your chat ID from @userinfobot"
    echo "3. Edit .env and add:"
    echo "   • TELEGRAM_BOT_TOKEN"
    echo "   • TELEGRAM_ADMIN_CHAT_ID"
    echo ""
    read -p "Press Enter to open .env file for editing..."

    # Try to open with default editor
    if [ -n "$EDITOR" ]; then
        $EDITOR .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Please edit .env manually with your preferred editor"
    fi
fi

# Build
echo ""
echo "→ Building TypeScript..."
npm run build

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        Setup Complete! ✓               ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure your .env is configured correctly"
echo "2. Start the bot with: npm start"
echo "3. Message your bot on Telegram with /start"
echo ""
echo "For detailed instructions, see QUICK-START.md"
echo ""
