import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env');
}

// Initialize the bot with polling
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Log bot info when started
bot.getMe().then((botInfo) => {
  console.log(`🤖 Bot started: @${botInfo.username}`);
  console.log('📡 Bot is running in polling mode');
}).catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const userId = msg.from?.id;
  const username = msg.from?.username || 'unknown';

  // Ignore messages from channels or forwarded messages
  if (!messageText || !userId || msg.chat.type === 'channel') {
    return;
  }

  try {
    console.log(`📨 New message from @${username} (${userId}): ${messageText}`);
    
    // Send message to your backend for analysis
    const response = await axios.post(
      `${BACKEND_URL}/api/analysis`,
      {
        text: messageText,
        user: userId.toString(),
        chatId: chatId.toString(),
        username: username
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const { isFraud, reason } = response.data;

    if (isFraud) {
      const warningMessage = `🚨 *Possible Fraud Detected!* 🚨\n\n` +
        `*Message:* ${messageText}\n` +
        `*Reason:* ${reason}\n\n` +
        `⚠️ *Warning:* This message appears to be part of a potential pump-and-dump scheme. Please verify information before making any investment decisions.`;

      await bot.sendMessage(chatId, warningMessage, { parse_mode: 'Markdown' });
      console.log(`⚠️ Fraud detected in message from @${username}`);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Only send error message to private chats to avoid spamming groups
    if (msg.chat.type === 'private') {
      await bot.sendMessage(
        chatId,
        '⚠️ An error occurred while analyzing this message. Please try again later.'
      );
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stopPolling());
process.once('SIGTERM', () => bot.stopPolling());

export default bot;
