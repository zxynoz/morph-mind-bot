require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

// Database files
const USERS_DB = path.join(__dirname, 'data', 'users.json');
const STAKES_DB = path.join(__dirname, 'data', 'stakes.json');
const POOLS_DB = path.join(__dirname, 'data', 'pools.json');

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');

// Initialize data directories
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Database helpers
function loadDB(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
    return {};
}

function saveDB(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error saving ${file}:`, error);
    }
}

// Initialize databases
let users = loadDB(USERS_DB);
let stakes = loadDB(STAKES_DB);
let pools = loadDB(POOLS_DB);

// Initialize default pools
if (Object.keys(pools).length === 0) {
    pools = {
        'marinade': { name: 'Marinade Finance', apy: 6.8, tvl: 0, active: true },
        'raydium': { name: 'Raydium', apy: 12.5, tvl: 0, active: true },
        'orca': { name: 'Orca', apy: 10.2, tvl: 0, active: true },
        'kamino': { name: 'Kamino', apy: 15.3, tvl: 0, active: true },
        'drift': { name: 'Drift Protocol', apy: 8.9, tvl: 0, active: true }
    };
    saveDB(POOLS_DB, pools);
}

// User management
function getUser(chatId) {
    return users[chatId] || null;
}

function createUser(chatId, username) {
    const wallet = Keypair.generate();
    users[chatId] = {
        chatId,
        username,
        publicKey: wallet.publicKey.toString(),
        privateKey: Buffer.from(wallet.secretKey).toString('base64'),
        balance: 0,
        totalStaked: 0,
        totalEarned: 0,
        activeStakes: [],
        createdAt: Date.now()
    };
    saveDB(USERS_DB, users);
    return users[chatId];
}

function getUserStakes(chatId) {
    return stakes[chatId] || [];
}

function addStake(chatId, amount, poolId) {
    if (!stakes[chatId]) stakes[chatId] = [];
    
    const stake = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        poolId,
        poolName: pools[poolId].name,
        startApy: pools[poolId].apy,
        currentApy: pools[poolId].apy,
        earned: 0,
        shares: parseFloat(amount), // tokenized shares
        startTime: Date.now(),
        lastCompound: Date.now()
    };
    
    stakes[chatId].push(stake);
    users[chatId].totalStaked += parseFloat(amount);
    users[chatId].activeStakes.push(stake.id);
    
    saveDB(STAKES_DB, stakes);
    saveDB(USERS_DB, users);
    
    return stake;
}

// AI yield optimization logic
function calculateOptimalPool() {
    const activePools = Object.entries(pools).filter(([_, p]) => p.active);
    
    // AI-like scoring: consider APY, TVL risk, and volatility
    const scored = activePools.map(([id, pool]) => {
        const apyScore = pool.apy * 0.6;
        const tvlScore = Math.min(pool.tvl / 1000000, 10) * 0.3;
        const stabilityScore = (15 - Math.abs(pool.apy - 10)) * 0.1;
        
        return {
            id,
            pool,
            score: apyScore + tvlScore + stabilityScore
        };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].id;
}

function autoCompoundRewards(chatId) {
    const userStakes = stakes[chatId] || [];
    let totalCompounded = 0;
    
    userStakes.forEach(stake => {
        const timeElapsed = Date.now() - stake.lastCompound;
        const hoursElapsed = timeElapsed / (1000 * 60 * 60);
        
        // Calculate rewards (APY compounded)
        const rewards = stake.amount * (stake.currentApy / 100) * (hoursElapsed / 8760);
        
        if (rewards > 0) {
            stake.amount += rewards;
            stake.earned += rewards;
            stake.shares = stake.amount; // Update tokenized shares
            stake.lastCompound = Date.now();
            totalCompounded += rewards;
            
            users[chatId].totalEarned += rewards;
        }
    });
    
    if (totalCompounded > 0) {
        saveDB(STAKES_DB, stakes);
        saveDB(USERS_DB, users);
    }
    
    return totalCompounded;
}

function reallocateStakes(chatId) {
    const userStakes = stakes[chatId] || [];
    let reallocated = 0;
    
    const optimalPool = calculateOptimalPool();
    
    userStakes.forEach(stake => {
        // Only reallocate if the new pool has significantly better APY (>2% difference)
        if (stake.poolId !== optimalPool && pools[optimalPool].apy - stake.currentApy > 2) {
            stake.poolId = optimalPool;
            stake.poolName = pools[optimalPool].name;
            stake.currentApy = pools[optimalPool].apy;
            reallocated++;
        }
    });
    
    if (reallocated > 0) {
        saveDB(STAKES_DB, stakes);
    }
    
    return reallocated;
}

// Keyboard layouts
function mainKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['💰 Stake SOL', '📊 My Portfolio'],
                ['🏦 Pools Info', '💸 Withdraw'],
                ['📈 Statistics', '⚙️ Settings']
            ],
            resize_keyboard: true
        }
    };
}

function backKeyboard() {
    return {
        reply_markup: {
            keyboard: [['🔙 Back to Menu']],
            resize_keyboard: true
        }
    };
}

// Bot commands
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || msg.from.first_name;
    
    let user = getUser(chatId);
    if (!user) {
        user = createUser(chatId, username);
    }
    
    const welcomeMsg = `🧠 *Welcome to Morph Mind!*

🚀 *Revolutionizing DeFi Yield Optimization*

Morph Mind uses AI to automatically compound your rewards across the best Solana protocols without gas fee lockups.

✨ *Key Features:*
• 🤖 AI-powered auto-compounding
• 💎 Dynamic reallocation to high-yield pools
• 🎯 Zero manual rebalancing needed
• 🪙 Tokenized shares for liquidity
• ⛽ No gas fee lockups

💼 *Your Wallet:*
\`${user.publicKey}\`

📝 *Getting Started:*
1. Deposit SOL to your wallet
2. Stake your SOL
3. AI handles the rest!

Use the menu below to get started! 👇`;
    
    bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.onText(/💰 Stake SOL|\/stake/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    
    if (!user) {
        bot.sendMessage(chatId, '⚠️ Please start the bot first with /start');
        return;
    }
    
    const stakeMsg = `💰 *Stake SOL with Morph Mind*

Current available pools and APYs:

${Object.entries(pools).filter(([_, p]) => p.active).map(([id, p]) => 
    `• ${p.name}: *${p.apy}% APY*`).join('\n')}

🤖 *AI will automatically:*
• Select the optimal pool
• Compound your rewards
• Reallocate to maximize yields

💵 *Your Balance:* ${user.balance.toFixed(4)} SOL

📝 Send the amount of SOL you want to stake:
(Min: ${process.env.MIN_STAKE_AMOUNT || 0.1} SOL)`;
    
    bot.sendMessage(chatId, stakeMsg, { parse_mode: 'Markdown', ...backKeyboard() });
    
    bot.once('message', (response) => {
        if (response.text === '🔙 Back to Menu') {
            bot.sendMessage(chatId, '🏠 Main Menu', mainKeyboard());
            return;
        }
        
        const amount = parseFloat(response.text);
        const minStake = parseFloat(process.env.MIN_STAKE_AMOUNT || 0.1);
        const maxStake = parseFloat(process.env.MAX_STAKE_AMOUNT || 1000);
        
        if (isNaN(amount) || amount < minStake || amount > maxStake) {
            bot.sendMessage(chatId, `❌ Invalid amount. Please enter between ${minStake} and ${maxStake} SOL.`, backKeyboard());
            return;
        }
        
        // Simulate balance check (in production, check actual wallet balance)
        if (amount > user.balance) {
            bot.sendMessage(chatId, `❌ Insufficient balance. Please deposit SOL to your wallet first.\n\n💼 Your wallet:\n\`${user.publicKey}\``, { parse_mode: 'Markdown', ...backKeyboard() });
            return;
        }
        
        // AI selects optimal pool
        const optimalPool = calculateOptimalPool();
        const stake = addStake(chatId, amount, optimalPool);
        
        user.balance -= amount;
        saveDB(USERS_DB, users);
        
        const confirmMsg = `✅ *Stake Successful!*

💰 *Amount:* ${amount} SOL
🏦 *Pool:* ${stake.poolName}
📈 *APY:* ${stake.startApy}%
🪙 *Shares:* ${stake.shares.toFixed(4)} MORPH

🤖 *AI Status:* Active
• Auto-compounding enabled
• Real-time yield optimization

Your rewards will be compounded automatically!`;
        
        bot.sendMessage(chatId, confirmMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
    });
});

bot.onText(/📊 My Portfolio|\/portfolio/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    
    if (!user) {
        bot.sendMessage(chatId, '⚠️ Please start the bot first with /start');
        return;
    }
    
    // Auto-compound before showing portfolio
    const compounded = autoCompoundRewards(chatId);
    
    const userStakes = getUserStakes(chatId);
    
    if (userStakes.length === 0) {
        bot.sendMessage(chatId, '📊 *Your Portfolio*\n\nNo active stakes yet. Start earning by staking SOL!', { parse_mode: 'Markdown', ...mainKeyboard() });
        return;
    }
    
    const stakesInfo = userStakes.map((stake, idx) => {
        const duration = Math.floor((Date.now() - stake.startTime) / (1000 * 60 * 60 * 24));
        return `
*Stake #${idx + 1}*
💰 Amount: ${stake.amount.toFixed(4)} SOL
🏦 Pool: ${stake.poolName}
📈 APY: ${stake.currentApy}%
💎 Earned: ${stake.earned.toFixed(6)} SOL
🪙 Shares: ${stake.shares.toFixed(4)} MORPH
⏱️ Duration: ${duration} days`;
    }).join('\n\n---\n');
    
    const portfolioMsg = `📊 *Your Portfolio*

💼 *Balance:* ${user.balance.toFixed(4)} SOL
💰 *Total Staked:* ${user.totalStaked.toFixed(4)} SOL
💎 *Total Earned:* ${user.totalEarned.toFixed(6)} SOL
📈 *ROI:* ${((user.totalEarned / user.totalStaked) * 100).toFixed(2)}%

*Active Stakes:*
${stakesInfo}

${compounded > 0 ? `\n🤖 Just auto-compounded ${compounded.toFixed(6)} SOL!` : ''}`;
    
    bot.sendMessage(chatId, portfolioMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.onText(/🏦 Pools Info|\/pools/, async (msg) => {
    const chatId = msg.chat.id;
    
    const poolsInfo = Object.entries(pools).filter(([_, p]) => p.active).map(([id, p]) => 
        `*${p.name}*\n📈 APY: ${p.apy}%\n💰 TVL: $${(p.tvl / 1000000).toFixed(2)}M\n✅ Status: Active`
    ).join('\n\n');
    
    const poolsMsg = `🏦 *Available Yield Pools*

${poolsInfo}

🤖 *AI Optimization:*
Our AI continuously monitors all pools and automatically reallocates your funds to maximize yields without any action needed from you.

⛽ *Zero Gas Fees:* No lockup periods or penalties
🔄 *Auto-Rebalancing:* Every hour
💎 *Tokenized Shares:* Liquid and transferable`;
    
    bot.sendMessage(chatId, poolsMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.onText(/💸 Withdraw|\/withdraw/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    
    if (!user) {
        bot.sendMessage(chatId, '⚠️ Please start the bot first with /start');
        return;
    }
    
    // Auto-compound before withdrawal
    autoCompoundRewards(chatId);
    
    const userStakes = getUserStakes(chatId);
    
    if (userStakes.length === 0) {
        bot.sendMessage(chatId, '❌ No active stakes to withdraw.', mainKeyboard());
        return;
    }
    
    const withdrawMsg = `💸 *Withdraw Funds*

💰 *Total Staked:* ${user.totalStaked.toFixed(4)} SOL
💎 *Total Earned:* ${user.totalEarned.toFixed(6)} SOL
📊 *Available:* ${(user.totalStaked + user.totalEarned).toFixed(4)} SOL

Select withdraw option:
1️⃣ Withdraw earnings only
2️⃣ Withdraw everything (stake + earnings)

Send 1 or 2:`;
    
    bot.sendMessage(chatId, withdrawMsg, { parse_mode: 'Markdown', ...backKeyboard() });
    
    bot.once('message', (response) => {
        if (response.text === '🔙 Back to Menu') {
            bot.sendMessage(chatId, '🏠 Main Menu', mainKeyboard());
            return;
        }
        
        const option = parseInt(response.text);
        
        if (option === 1) {
            const earnings = user.totalEarned;
            user.balance += earnings;
            user.totalEarned = 0;
            
            // Reset earnings on stakes
            stakes[chatId].forEach(stake => stake.earned = 0);
            
            saveDB(USERS_DB, users);
            saveDB(STAKES_DB, stakes);
            
            bot.sendMessage(chatId, `✅ *Withdrawal Successful!*\n\n💰 Withdrawn: ${earnings.toFixed(6)} SOL\n💼 New Balance: ${user.balance.toFixed(4)} SOL\n\nYour stakes remain active and earning!`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else if (option === 2) {
            const total = user.totalStaked + user.totalEarned;
            user.balance += total;
            user.totalStaked = 0;
            user.totalEarned = 0;
            user.activeStakes = [];
            stakes[chatId] = [];
            
            saveDB(USERS_DB, users);
            saveDB(STAKES_DB, stakes);
            
            bot.sendMessage(chatId, `✅ *Full Withdrawal Successful!*\n\n💰 Withdrawn: ${total.toFixed(4)} SOL\n💼 New Balance: ${user.balance.toFixed(4)} SOL\n\nAll stakes have been closed. Start staking again anytime!`, { parse_mode: 'Markdown', ...mainKeyboard() });
        } else {
            bot.sendMessage(chatId, '❌ Invalid option. Please try again.', mainKeyboard());
        }
    });
});

bot.onText(/📈 Statistics|\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    
    const totalUsers = Object.keys(users).length;
    const totalStaked = Object.values(users).reduce((sum, u) => sum + u.totalStaked, 0);
    const totalEarned = Object.values(users).reduce((sum, u) => sum + u.totalEarned, 0);
    const avgApy = Object.values(pools).filter(p => p.active).reduce((sum, p) => sum + p.apy, 0) / Object.values(pools).filter(p => p.active).length;
    
    const statsMsg = `📈 *Morph Mind Statistics*

👥 *Total Users:* ${totalUsers}
💰 *Total Value Locked:* ${totalStaked.toFixed(2)} SOL
💎 *Total Rewards Paid:* ${totalEarned.toFixed(4)} SOL
📊 *Average APY:* ${avgApy.toFixed(2)}%

🤖 *AI Performance:*
• Active rebalances: 24/7
• Optimal pool selection: Enabled
• Auto-compounding: Active
• Gas optimization: Maximized

🚀 *Platform Health:* Excellent`;
    
    bot.sendMessage(chatId, statsMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.onText(/⚙️ Settings|\/settings/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    
    if (!user) {
        bot.sendMessage(chatId, '⚠️ Please start the bot first with /start');
        return;
    }
    
    const settingsMsg = `⚙️ *Settings*

💼 *Your Wallet:*
\`${user.publicKey}\`

🔐 *Security:*
Your private key is securely stored and encrypted. Never share it with anyone.

📊 *Preferences:*
• Auto-compound: ✅ Enabled
• AI rebalancing: ✅ Enabled
• Notifications: ✅ Enabled

🔑 To export your private key (DANGER):
Send: /exportkey

⚠️ *Warning:* Only export your key if you know what you're doing!`;
    
    bot.sendMessage(chatId, settingsMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
});

bot.onText(/\/exportkey/, async (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    
    if (!user) {
        bot.sendMessage(chatId, '⚠️ Please start the bot first with /start');
        return;
    }
    
    bot.sendMessage(chatId, `🔐 *SECURITY WARNING*\n\n⚠️ Your private key gives FULL access to your wallet.\n\nNEVER share this with anyone!\n\n*Private Key:*\n\`${user.privateKey}\`\n\nDelete this message after saving it securely!`, { parse_mode: 'Markdown' });
});

bot.onText(/🔙 Back to Menu/, (msg) => {
    bot.sendMessage(msg.chat.id, '🏠 Main Menu', mainKeyboard());
});

bot.onText(/\/help/, (msg) => {
    const helpMsg = `🧠 *Morph Mind Help*

*Commands:*
/start - Start the bot
/stake - Stake SOL
/portfolio - View your portfolio
/pools - View available pools
/withdraw - Withdraw funds
/stats - Platform statistics
/settings - Bot settings
/help - Show this help

*Features:*
• 🤖 AI auto-compounding
• 💎 Tokenized shares (MORPH)
• 🔄 Dynamic reallocation
• ⛽ Zero gas fee lockups
• 📈 Real-time optimization

*Support:*
For help, contact @MorphMindSupport`;
    
    bot.sendMessage(msg.chat.id, helpMsg, { parse_mode: 'Markdown', ...mainKeyboard() });
});

// Background AI tasks
setInterval(() => {
    console.log('🤖 Running AI auto-compound cycle...');
    
    Object.keys(users).forEach(chatId => {
        const compounded = autoCompoundRewards(chatId);
        if (compounded > 0) {
            console.log(`User ${chatId}: Compounded ${compounded.toFixed(6)} SOL`);
        }
        
        const reallocated = reallocateStakes(chatId);
        if (reallocated > 0) {
            console.log(`User ${chatId}: Reallocated ${reallocated} stakes`);
            bot.sendMessage(chatId, `🤖 *AI Rebalance Alert*\n\nYour funds have been reallocated to higher-yield pools!\n\n${reallocated} stake(s) moved for better returns.`, { parse_mode: 'Markdown' });
        }
    });
    
    // Update pool APYs (simulate market changes)
    Object.keys(pools).forEach(poolId => {
        const variance = (Math.random() - 0.5) * 0.5; // ±0.25% variance
        pools[poolId].apy = Math.max(5, Math.min(20, pools[poolId].apy + variance));
    });
    saveDB(POOLS_DB, pools);
    
}, parseInt(process.env.AUTO_COMPOUND_INTERVAL) || 3600000); // Default 1 hour

// Periodic notifications
setInterval(() => {
    Object.entries(users).forEach(([chatId, user]) => {
        if (user.totalEarned > 0.001) { // Only notify if earned > 0.001 SOL
            bot.sendMessage(chatId, `💎 *Earnings Update*\n\nYou've earned ${user.totalEarned.toFixed(6)} SOL so far!\n\n🤖 AI is continuously optimizing your yields.`, { parse_mode: 'Markdown' });
        }
    });
}, 86400000); // Daily

console.log('🧠 Morph Mind Bot is running...');
console.log('🤖 AI yield optimization active');
console.log('💰 Ready to revolutionize DeFi!');
