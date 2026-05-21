# Discord AI Agent - Nexa AI Suite Gerald

An n8n AI Agent workflow triggered by Discord messages. Uses **OpenAI GPT-4o-mini** (cost-effective + smart) with full access to Google tools.

## Architecture

```
Discord Message → Bot Forwarder → n8n Webhook → AI Agent (GPT-4o-mini) → Discord Response
                                                      ↓
                                              Google Tools:
                                              • Gmail
                                              • Google Calendar
                                              • Google Drive
                                              • Google Sheets
```

## Setup Instructions

### Step 1: Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it (e.g., "Gerald AI")
3. Go to **Bot** tab → Click **Reset Token** → **Copy the token**
4. Enable these **Privileged Gateway Intents**:
   - ✅ MESSAGE CONTENT INTENT
   - ✅ SERVER MEMBERS INTENT
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Read Message History`, `View Channels`
6. Copy the generated URL and open it to add the bot to your **Nexa AI Suite** server

### Step 2: Get Channel ID

1. In Discord, enable Developer Mode: **Settings → Advanced → Developer Mode**
2. Right-click the **"Nexa Ai suite gerald 1 on 1"** channel
3. Click **Copy Channel ID** — you'll need this for the n8n workflow

### Step 3: Set Up n8n Workflow

1. Open your n8n instance
2. Import the workflow from `discord-ai-agent-workflow.js` using the n8n SDK, OR manually recreate it:

   **Nodes to create:**
   - **Webhook Trigger** — Path: `discord-ai-agent`, Method: POST
   - **AI Agent** — Model: GPT-4o-mini, System prompt included in the workflow file
   - **Discord Send Message** — Channel ID: paste your channel ID, Content: `{{ $json.output }}`

3. **Configure Credentials in n8n:**
   - **OpenAI** — Add your OpenAI API key
   - **Google Gmail OAuth2** — Connect your Google account
   - **Google Calendar OAuth2** — Connect your Google account
   - **Google Drive OAuth2** — Connect your Google account
   - **Google Sheets OAuth2** — Connect your Google account
   - **Discord Bot API** — Add your Discord bot token

4. **Activate the workflow** in n8n

### Step 4: Run the Bot Forwarder

```bash
cd n8n-discord-ai-agent
npm install
```

Set environment variables:
```bash
# Windows PowerShell
$env:DISCORD_BOT_TOKEN = "your-discord-bot-token"
$env:N8N_WEBHOOK_URL = "https://your-n8n-instance.com/webhook/discord-ai-agent"

# Then run:
npm start
```

The bot will now listen to messages in your "Nexa Ai suite gerald 1 on 1" channel and forward them to n8n for AI processing.

## Configuration

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token from Developer Portal |
| `N8N_WEBHOOK_URL` | Your n8n webhook URL (e.g., `http://localhost:5678/webhook/discord-ai-agent`) |

## Model Choice

**GPT-4o-mini** was selected because:
- ~95% as smart as GPT-4o for most tasks
- **~15x cheaper** than GPT-4 ($0.15/1M input, $0.60/1M output)
- Fast response times
- Supports tool calling (required for Google tools)

## Google Tools Available

| Tool | Capabilities |
|------|-------------|
| **Gmail** | Send emails, search inbox, read emails |
| **Google Calendar** | Create/read/update events, check availability |
| **Google Drive** | Search files, create/read/update documents |
| **Google Sheets** | Read/write spreadsheet data, create sheets |

## Notes

- The bot ignores its own messages to prevent infinite loops
- Conversation memory is maintained per channel+user combination (20 message window)
- The channel filter in `discord-bot-forwarder.js` matches channels containing "nexa" or "gerald" — adjust if needed
