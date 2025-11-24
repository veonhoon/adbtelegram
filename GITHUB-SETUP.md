# GitHub Setup & Deployment Guide

## ✅ Git Repository Initialized

Your code is now committed locally and ready to push to GitHub!

---

## Step 1: Create GitHub Repository

1. **Go to GitHub:** https://github.com/new

2. **Create new repository:**
   - Repository name: `adb-tracker-bot` (or your choice)
   - Description: `Multi-server ADB device monitoring with Telegram bot - 122 phone farm tracker`
   - Visibility: **Private** (recommended - contains your bot token in git history)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

---

## Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Run these:

```bash
cd "c:\New folder"

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/adb-tracker-bot.git

# Push code
git branch -M main
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johnsmith/adb-tracker-bot.git
git branch -M main
git push -u origin main
```

---

## Step 3: Clone to Each Server

Now you can clone from GitHub to each server instead of copying files!

### On Opti Server:
```bash
cd c:\
git clone https://github.com/YOUR_USERNAME/adb-tracker-bot.git
cd adb-tracker-bot
npm install
npm run build

# Copy server-specific files
copy deployment\opti\.env .
copy deployment\opti\rename-devices.js .
copy start-pm2-agent.bat .

# Rename devices and start
node rename-devices.js
start-pm2-agent.bat
```

### On Mini, Paso, Dojang (same process):
```bash
cd c:\
git clone https://github.com/YOUR_USERNAME/adb-tracker-bot.git
cd adb-tracker-bot
npm install
npm run build

# Replace 'mini' with 'paso' or 'dojang' as needed
copy deployment\mini\.env .
copy deployment\mini\rename-devices.js .
copy start-pm2-agent.bat .

node rename-devices.js
start-pm2-agent.bat
```

---

## Step 4: Future Updates

When you make changes on Lulu:

### On Lulu (Master):
```bash
cd "c:\New folder"

# Make your code changes...

# Build
npm run build

# Commit and push
git add .
git commit -m "Description of changes"
git push

# Restart local bot
pm2 restart adb-lulu
```

### On Each Agent Server:
```bash
cd c:\adb-tracker-bot

# Pull latest changes
git pull

# Rebuild
npm run build

# Restart
pm2 restart adb-{server}
```

---

## Benefits of Using GitHub

✅ **Version Control** - Track all changes, rollback if needed
✅ **Easy Deployment** - Just `git clone` on new servers
✅ **Easy Updates** - Just `git pull` to update
✅ **Backup** - Code is safely stored on GitHub
✅ **Collaboration** - Easy to share with team

---

## Security Note

Your `.gitignore` is configured to **exclude**:
- `.env` files (contains bot token)
- `*.db` files (database with device info)
- `node_modules/`
- `deployment/` folders

These are **NOT** pushed to GitHub, keeping your secrets safe!

---

## Alternative: Private Repository

If you want extra security, make the repository private:

1. Go to repository Settings on GitHub
2. Scroll to "Danger Zone"
3. Click "Change visibility"
4. Select "Private"

---

## Quick Reference

### First Time Setup:
1. Create repo on GitHub
2. `git remote add origin https://github.com/...`
3. `git push -u origin main`

### Deploy to Server:
1. `git clone https://github.com/...`
2. `npm install && npm run build`
3. Copy server-specific files from `deployment/{server}/`
4. Run `start-pm2-agent.bat`

### Update Servers:
1. Make changes on lulu
2. `git push`
3. On each server: `git pull && npm run build && pm2 restart`

---

**You're all set for GitHub deployment!** 🚀
