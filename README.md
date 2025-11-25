# 🧠 Monad Mind Bot

**Revolutionizes DeFi yield optimization by using AI to auto-compound rewards across Monad protocols without gas fee lockups.**

🌐 **Website:** [monadmind.space](https://monadmind.space)

## 🚀 Features

- **🤖 AI-Powered Auto-Compounding**: Automatically compounds rewards every hour without manual intervention
- **💎 Dynamic Reallocation**: AI reallocates funds to highest-yield pools in real-time
- **🎯 Zero Manual Rebalancing**: Set it and forget it - AI handles everything
- **🪙 Tokenized Shares (MONAD)**: Liquid tokenized shares for flexibility
- **⛽ No Gas Fee Lockups**: Withdraw anytime without penalties
- **📈 Real-Time Optimization**: Continuous monitoring and optimization of yields
- **🔐 Secure Wallet Management**: Each user gets a dedicated Monad wallet

## 🚂 Railway Deployment (Recommended)

### Quick Deploy to Railway

1. **Fork/Clone this repository**

2. **Create a Railway account**: [railway.app](https://railway.app)

3. **Deploy:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository
   - Railway will auto-detect and deploy

4. **Set Environment Variables in Railway Dashboard:**
   - Go to your project → Variables
   - Add: `TELEGRAM_BOT_TOKEN` = `8382759644:AAGdXf-gGUUXysZJLwEwG0ZmlSy6neaVvmQ`
   - Optional: `AUTO_COMPOUND_INTERVAL` = `3600000` (1 hour)
   - Optional: `MIN_STAKE_AMOUNT` = `0.1`
   - Optional: `MAX_STAKE_AMOUNT` = `1000`

5. **Deploy!** Railway will automatically start your bot 24/7

✅ **Advantages:**
- 24/7 uptime
- Auto-restart on failure
- Free $5 monthly credit
- No server management

## 📦 Local Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Setup

1. **Clone or navigate to the project:**
```bash
cd C:\Users\PC\Projects\monad-mind-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

4. **Edit `.env` file with your credentials:**
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
MONAD_RPC_URL=https://api.mainnet-beta.monad.com
MONAD_NETWORK=mainnet-beta
AUTO_COMPOUND_INTERVAL=3600000
MIN_STAKE_AMOUNT=0.1
MAX_STAKE_AMOUNT=1000
```

5. **Get your Telegram Bot Token:**
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Send `/newbot` and follow the instructions
   - Copy the token and paste it in your `.env` file

6. **Start the bot:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🎮 Usage

### User Commands

- `/start` - Start the bot and create your wallet
- `/stake` - Stake MONAD and start earning
- `/portfolio` - View your active stakes and earnings
- `/pools` - View available yield pools
- `/withdraw` - Withdraw your earnings or full stake
- `/stats` - View platform statistics
- `/settings` - View your wallet and settings
- `/help` - Show help menu

### Bot Buttons

- **💰 Stake MONAD** - Start staking process
- **📊 My Portfolio** - View your stakes and earnings
- **🏦 Pools Info** - See all available pools and APYs
- **💸 Withdraw** - Withdraw earnings or full amount
- **📈 Statistics** - Platform-wide statistics
- **⚙️ Settings** - Your wallet and preferences

## 🏦 Supported Pools

- **MonadStake Finance** - Liquid staking (6-8% APY)
- **MonadSwap** - DEX liquidity pools (10-15% APY)
- **MonadPool** - Automated market maker (8-12% APY)
- **MonadYield** - Liquidity management (12-18% APY)
- **MonadLend Protocol** - Perpetual futures (7-10% APY)

*APYs are dynamic and updated in real-time by the AI*

## 🤖 AI Features

### Auto-Compounding
- Runs every hour (configurable)
- Automatically compounds all rewards
- Updates tokenized shares
- No gas fees deducted from rewards

### Dynamic Reallocation
- Monitors all pools 24/7
- Scores pools based on APY, TVL, and stability
- Reallocates when better opportunities arise (>2% APY difference)
- Sends notifications when reallocation occurs

### Yield Optimization
The AI uses a sophisticated scoring algorithm:
- **APY Score (60%)** - Higher yields preferred
- **TVL Score (30%)** - Considers pool liquidity and safety
- **Stability Score (10%)** - Prefers consistent returns

## 📁 Project Structure

```
monad-mind-bot/
├── bot.js              # Main bot application
├── package.json        # Dependencies and scripts
├── .env               # Environment configuration (create from .env.example)
├── .env.example       # Example environment variables
├── README.md          # This file
└── data/              # Database files (auto-created)
    ├── users.json     # User data and wallets
    ├── stakes.json    # Active stakes information
    └── pools.json     # Pool configurations and APYs
```

## 🔐 Security

- Private keys are stored locally in encrypted format
- Each user gets a unique Monad wallet
- Private keys can be exported via `/exportkey` command
- Never share your private key with anyone
- The bot runs on your server with full data control

## 💡 How It Works

1. **User Stakes MONAD**
   - User deposits MONAD to their wallet
   - Specifies amount to stake
   - AI selects optimal pool

2. **AI Auto-Compounds**
   - Every hour, bot calculates accrued rewards
   - Automatically compounds rewards into principal
   - Updates tokenized shares (MORPH)

3. **AI Reallocates**
   - Continuously monitors all pools
   - When better opportunities arise (>2% APY difference)
   - Automatically moves funds to higher-yield pools

4. **User Withdraws**
   - Can withdraw earnings only or full amount
   - No penalties or lockup periods
   - Instant processing

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Required |
| `MONAD_RPC_URL` | Monad RPC endpoint | mainnet-beta |
| `AUTO_COMPOUND_INTERVAL` | Auto-compound interval (ms) | 3600000 (1 hour) |
| `MIN_STAKE_AMOUNT` | Minimum stake amount (MONAD) | 0.1 |
| `MAX_STAKE_AMOUNT` | Maximum stake amount (MONAD) | 1000 |

### Customization

To add more pools, edit the `pools` object in `bot.js`:
```javascript
pools = {
    'pool_id': { 
        name: 'Pool Name', 
        apy: 10.5, 
        tvl: 1000000, 
        active: true 
    }
};
```

## 📊 Database

All data is stored locally in JSON files:

- **users.json** - User accounts, wallets, balances, stats
- **stakes.json** - Active stakes with amounts, pools, earnings
- **pools.json** - Pool configurations and current APYs

## 🚨 Troubleshooting

### Bot not responding
- Check if bot is running: `npm start`
- Verify `TELEGRAM_BOT_TOKEN` in `.env`
- Check bot logs for errors

### Wallet issues
- Use `/exportkey` to backup your private key
- Import private key to Phantom or Solflare wallet
- Never share your private key

### Connection issues
- Check Monad RPC endpoint
- Try alternative RPC: `https://api.devnet.monad.com` for testing
- Verify internet connection

## 📈 Future Enhancements

- [ ] Real blockchain integration with actual staking
- [ ] More DeFi protocols (Jupiter, Saber, etc.)
- [ ] Advanced AI algorithms (ML-based predictions)
- [ ] Multi-chain support (Ethereum, BSC)
- [ ] Referral program
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Support

For issues or questions:
- Create an issue on GitHub
- Contact: @MorphMindSupport on Telegram

## ⚠️ Disclaimer

This is a demonstration bot. For production use with real funds:
1. Implement proper security audits
2. Use hardware wallets for key storage
3. Add proper error handling
4. Implement rate limiting
5. Add comprehensive testing
6. Integrate with actual Monad protocols

**Use at your own risk. Not financial advice.**

---

Built with ❤️ for the Monad DeFi community

🚀 **Monad Mind - AI-Powered Yield Optimization**
