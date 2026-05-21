import { workflow, node, trigger, sticky, placeholder, newCredential, languageModel, memory, tool, fromAi, expr } from '@n8n/workflow-sdk';

// ============================================================
// Discord AI Agent Workflow
// Triggers on Discord messages → AI Agent (GPT-4o-mini) → Responds in Discord
// Google Tools: Gmail, Calendar, Drive, Sheets
// Target Channel: "Nexa Ai suite gerald 1 on 1"
// ============================================================

// --- Language Model: OpenAI GPT-4o-mini (cost-effective + smart) ---
const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'GPT-4o-mini',
    parameters: {
      model: 'gpt-4o-mini',
      options: {
        temperature: 0.7
      }
    },
    credentials: { openAiApi: newCredential('OpenAI') }
  }
});

// --- Memory: Window Buffer for conversation context ---
const conversationMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.3,
  config: {
    name: 'Conversation Memory',
    parameters: {
      sessionKey: expr('{{ $json.channelId }}_{{ $json.authorId }}'),
      contextWindowLength: 20
    }
  }
});

// --- Google Tools ---
const gmailTool = tool({
  type: 'n8n-nodes-base.gmailTool',
  version: 1,
  config: {
    name: 'Gmail',
    parameters: {
      sendTo: fromAi('recipient', 'Email address to send to'),
      subject: fromAi('subject', 'Email subject line'),
      message: fromAi('body', 'Email body content')
    },
    credentials: { gmailOAuth2: newCredential('Google Gmail') }
  }
});

const googleCalendarTool = tool({
  type: 'n8n-nodes-base.googleCalendarTool',
  version: 1,
  config: {
    name: 'Google Calendar',
    parameters: {},
    credentials: { googleCalendarOAuth2Api: newCredential('Google Calendar') }
  }
});

const googleDriveTool = tool({
  type: 'n8n-nodes-base.googleDriveTool',
  version: 1,
  config: {
    name: 'Google Drive',
    parameters: {},
    credentials: { googleDriveOAuth2Api: newCredential('Google Drive') }
  }
});

const googleSheetsTool = tool({
  type: 'n8n-nodes-base.googleSheetsTool',
  version: 1,
  config: {
    name: 'Google Sheets',
    parameters: {},
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets') }
  }
});

// --- Trigger: Webhook (receives Discord bot message events) ---
const discordWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Discord Message Trigger',
    parameters: {
      path: 'discord-ai-agent',
      httpMethod: 'POST',
      responseMode: 'responseNode'
    }
  }
});

// --- AI Agent: Processes incoming Discord messages ---
const aiAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Gerald AI Agent',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.body.content }}'),
      systemMessage: `You are Gerald, an intelligent AI assistant in the Nexa AI Suite Discord server. You are helpful, concise, and professional. You have access to Google tools (Gmail, Calendar, Drive, Sheets) to help users with their tasks. When using tools, always confirm what you're about to do before taking action. Be conversational but efficient.`
    },
    subnodes: {
      model: openAiModel,
      memory: conversationMemory,
      tools: [gmailTool, googleCalendarTool, googleDriveTool, googleSheetsTool]
    }
  }
});

// --- Send Response back to Discord channel ---
const sendDiscordResponse = node({
  type: 'n8n-nodes-base.discord',
  version: 2.2,
  config: {
    name: 'Send to Nexa AI Suite',
    parameters: {
      resource: 'message',
      operation: 'send',
      channelId: placeholder('Paste your "Nexa Ai suite gerald 1 on 1" Discord Channel ID here'),
      content: expr('{{ $json.output }}')
    },
    credentials: { discordBotApi: newCredential('Gerald') }
  }
});

// --- Info Sticky Note ---
const setupNote = sticky(
  `## Discord AI Agent - Setup Instructions\n\n` +
  `### 1. Discord Bot Setup\n` +
  `- Create a bot at https://discord.com/developers/applications\n` +
  `- Enable MESSAGE CONTENT intent under Bot settings\n` +
  `- Add bot to your server with Send Messages + Read Message History permissions\n\n` +
  `### 2. Forward Messages to Webhook\n` +
  `- Use a small Discord.js script or Autocode to forward messages from the "Nexa Ai suite gerald 1 on 1" channel to this workflow's webhook URL\n` +
  `- POST to: [your-n8n-url]/webhook/discord-ai-agent\n` +
  `- Body: { "content": "message text", "channelId": "...", "authorId": "...", "authorName": "..." }\n\n` +
  `### 3. Credentials\n` +
  `- Set up OpenAI API key in n8n credentials\n` +
  `- Connect Google OAuth2 for Gmail, Calendar, Drive, Sheets\n` +
  `- Add Discord Bot Token credential\n\n` +
  `### 4. Channel ID\n` +
  `- Right-click the "Nexa Ai suite gerald 1 on 1" channel → Copy Channel ID\n` +
  `- Paste it in the "Send to Nexa AI Suite" node`,
  [discordWebhook, aiAgent, sendDiscordResponse],
  { color: 4 }
);

// --- Compose Workflow ---
export default workflow('discord-ai-agent', 'Discord AI Agent - Nexa Suite Gerald')
  .add(discordWebhook)
  .to(aiAgent)
  .to(sendDiscordResponse);
