// Gerald Bot - Forwards messages from "Nexa Ai suite gerald 1 on 1" channel to n8n webhook
// Install: npm install discord.js
// Run: node discord-bot-forwarder.js

const { Client, GatewayIntentBits } = require('discord.js');

// === CONFIGURATION ===
// Use your Gerald bot token (same one configured in n8n credentials)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_GERALD_BOT_TOKEN_HERE';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://nexa-ai-64nu.onrender.com/webhook/discord-gerald-agent';
const TARGET_CHANNEL_NAME = 'nexa-ai-suite-gerald-1-on-1'; // Adjust to match your exact channel name/slug

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  console.log(`Listening for messages in channels matching: "${TARGET_CHANNEL_NAME}"`);
  console.log(`Forwarding to: ${N8N_WEBHOOK_URL}`);
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages (prevents infinite loops)
  if (message.author.bot) return;

  // Filter to target channel (match by name fragment)
  const channelName = message.channel.name?.toLowerCase() || '';
  if (!channelName.includes('nexa') && !channelName.includes('gerald')) {
    return;
  }

  console.log(`[${message.channel.name}] ${message.author.username}: ${message.content}`);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message.content,
        channelId: message.channel.id,
        authorId: message.author.id,
        authorName: message.author.username,
        guildId: message.guild?.id,
        timestamp: message.createdTimestamp,
      }),
    });

    if (!response.ok) {
      console.error(`Webhook returned ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to forward message to n8n:', error.message);
  }
});

client.login(DISCORD_BOT_TOKEN);
