# 🚂 Railway Deployment Guide

## Quick Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit - Monad Mind Bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/monad-mind-bot.git
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub

2. Click **"New Project"**

3. Select **"Deploy from GitHub repo"**

4. Choose **monad-mind-bot** repository

5. Railway will auto-detect the Node.js project and start building

### 3. Configure Environment Variables

After deployment starts:

1. Click on your project
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables:

**Required:**
```
TELEGRAM_BOT_TOKEN = 8382759644:AAGdXf-gGUUXysZJLwEwG0ZmlSy6neaVvmQ
```

**Optional (defaults are already set in code):**
```
AUTO_COMPOUND_INTERVAL = 3600000
MIN_STAKE_AMOUNT = 0.1
MAX_STAKE_AMOUNT = 1000
MONAD_RPC_URL = https://api.mainnet-beta.monad.com
```

### 4. Deploy!

- Railway will automatically redeploy with the environment variables
- Your bot will be live 24/7!
- Check the **"Deployments"** tab for logs

## ✅ Verification

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Bot should respond instantly!

## 📊 Monitoring

- **View Logs**: Railway Dashboard → Deployments → View Logs
- **Restart Bot**: Railway Dashboard → Settings → Restart
- **Check Status**: Look for "🧠 Monad Mind Bot is running..." in logs

## 💰 Pricing

- Railway offers **$5 free credit per month**
- This bot uses minimal resources (~512MB RAM)
- Should run free for most of the month!

## 🔧 Updating the Bot

```bash
# Make your changes
git add .
git commit -m "Update bot"
git push

# Railway auto-deploys on push!
```

## 🆘 Troubleshooting

### Bot not responding
- Check Railway logs for errors
- Verify `TELEGRAM_BOT_TOKEN` is set correctly
- Make sure deployment is active (green status)

### Database issues
- Railway provides persistent storage
- Data is saved in `/data` directory
- Survives restarts and redeployments

### Connection issues
- Check Monad RPC endpoint
- Railway has good network connectivity
- No additional firewall configuration needed

## 🎉 Done!

Your Monad Mind bot is now running 24/7 on Railway with automatic restarts and scaling!
