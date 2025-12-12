# Standalone Conversations App with Intelligence Export

A complete, standalone application for managing Twilio Conversations with integrated Conversational Intelligence Export functionality.

## 🎯 Key Feature: Proper Export Implementation

This app correctly implements the `/Export` endpoint from the **Twilio Conversations API** (not Voice API), ensuring that conversation messages (chat, WhatsApp, SMS) are exported to Intelligence Services, NOT voice call transcriptions.

## 🚀 Quick Start

### 1. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 2. Start the Server

```bash
cd server
npm start
```

Server runs on `http://localhost:3001`

### 3. Start the Client

```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173`

### 4. Access the App

1. Open `http://localhost:5173` in your browser
2. Enter your Twilio Account SID and Auth Token
3. Start managing conversations!

## 📋 Features

- ✅ **Full CRUD for All Resources**:
  - Conversation Services (Create, Read, Update, Delete)
  - Conversations (Create, Read, Update, Delete)
  - Messages (Create, Read, Update, Delete)
  - Participants (Create, Read, Delete)
  - Webhooks (Create, Read, Update, Delete)
- ✅ **Export to Intelligence** - The key feature using Conversations API `/Export`
- ✅ **Operator Results Viewing** - View AI analysis (summaries, classifications, extractions)
- ✅ **Clean, Modern UI** - Easy to use interface
- ✅ **Server-side Credentials** - Secure credential management

## 🔑 The Export Fix

### What Makes This Different?

The `/Export` endpoint is **part of the Conversations API** and exports:
- ✅ Chat conversations
- ✅ WhatsApp messages
- ✅ SMS via Conversations API
- ❌ NOT Voice call transcriptions

### How It Works

1. Create a Conversation Service
2. Create Conversations with messages
3. Click "Export to Intelligence"
4. Select an Intelligence Service
5. Export creates a transcript of your **conversation messages**
6. View the transcript automatically

## 📁 Project Structure

```
Conversations-App/
├── server/                    # Backend Express server
│   ├── index.js              # Main server file with all endpoints
│   ├── package.json
│   ├── .env
│   └── test-export-endpoint.js
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── ConversationsApp.jsx
│   │   ├── components/
│   │   │   └── auth/
│   │   │       └── RequireCredentials.jsx
│   │   ├── services/
│   │   │   └── apiClient.js
│   │   ├── styles/
│   │   │   └── ConversationsApp.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md                  # This file
```

## 🔧 API Endpoints

### Complete API Reference

For the full API documentation including all CRUD operations, see **[API_REFERENCE.md](API_REFERENCE.md)**

### Key Endpoints Summary

**Credentials**
- `POST /api/credentials` - Save credentials
- `GET /api/credentials/status` - Check status
- `DELETE /api/credentials` - Clear credentials

**Conversation Services** (Full CRUD)
- List, Create, Update, Delete services

**Conversations** (Full CRUD, service-scoped)
- List, Get, Create, Update, Delete conversations

**Messages** (Full CRUD)
- List, Send, Update, Delete messages

**Participants** (Create, Read, Delete)
- List, Add, Delete participants

**Webhooks** (Full CRUD)
- List, Create, Update, Delete webhooks

**Export to Intelligence** (Key Endpoint)
- `POST /conversations/services/:serviceSid/conversations/:conversationSid/export`
  - Exports conversation messages to Intelligence Service
  - Returns transcript SID for operator results

**Intelligence**
- List Intelligence Services
- Get transcripts
- Get operator results (AI analysis: summaries, classifications, extractions)

## 🧪 Testing

Run the test script to verify the export endpoint:

```bash
cd server
npm test
```

This will:
1. Check server health
2. Verify credentials
3. List services and conversations
4. Test the export endpoint
5. Confirm transcript creation

## 📖 Usage Guide

### Creating Your First Conversation

1. **Create a Service**: Click "Create Service" and enter a name
2. **Create a Conversation**: Select the service, click "Create Conversation"
3. **Add Messages**: Open the conversation, go to Messages, click "Send Message"
4. **Add Participants**: Go to Participants tab, click "Add Participant"

### Exporting to Intelligence

1. **Open a Conversation**: Click "View" on any conversation with messages
2. **Click "Export to Intelligence"**
3. **Select Intelligence Service**: Choose from your available services
4. **Click "Export"**
5. **View Transcript**: The transcript will appear automatically after 2-3 seconds

## 🔐 Security Notes

- Credentials are stored server-side in `.credentials.json`
- Never commit `.credentials.json` to version control
- Use environment variables or secret managers in production
- The `.gitignore` file is configured to exclude sensitive files

## 🐛 Troubleshooting

### Export Not Working
- Ensure you have messages in the conversation
- Verify Intelligence Service SID is correct (starts with `GA`)
- Check server logs for errors

### No Intelligence Services
- Create an Intelligence Service in Twilio Console
- Ensure your credentials have access to Intelligence API

### Transcript Not Appearing
- Wait 2-5 seconds for processing
- Check transcript status via Intelligence API
- Ensure messages exist in the conversation

## 📚 Additional Documentation

- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation with all CRUD endpoints
- **[QUICK_START.md](QUICK_START.md)** - Detailed setup instructions
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details and architecture

## 🔗 Twilio Documentation

- [Conversations API](https://www.twilio.com/docs/conversations)
- [Export Endpoint](https://www.twilio.com/docs/conversations/api/conversation-resource#export-a-conversation)
- [Intelligence API](https://www.twilio.com/docs/intelligence)

## 💡 Key Takeaway

**The `/Export` endpoint is part of the Conversations API**, not the Voice API. It's specifically designed for exporting text-based conversations (chat, WhatsApp, SMS) to Intelligence Services for analysis.

## License

This is a demonstration application.
