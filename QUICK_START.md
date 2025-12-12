# Quick Start Guide

Get up and running with the Conversations App in 5 minutes!

## Prerequisites

- Node.js (v16 or higher)
- npm
- Twilio Account (with Account SID and Auth Token)
- At least one Intelligence Service created in Twilio Console

## Step 1: Install Dependencies (2 minutes)

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 2: Start the Server (30 seconds)

```bash
cd server
npm start
```

You should see:
```
Conversations App Server running on port 3001
Health check: http://localhost:3001/health
```

## Step 3: Start the Client (30 seconds)

Open a new terminal:

```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 4: Configure Credentials (1 minute)

1. Open `http://localhost:5173` in your browser
2. You'll see a credentials form
3. Enter your Twilio Account SID
4. Enter your Twilio Auth Token
5. Click "Save Credentials"

## Step 5: Create Your First Conversation (2 minutes)

### Create a Service
1. Click "Create Service"
2. Enter a name like "My First Service"
3. Click "Create"

### Create a Conversation
1. Click "View" on your new service
2. Click "Create Conversation"
3. Enter a friendly name like "Test Conversation"
4. Click "Create"

### Add Messages
1. Click "View" on your conversation
2. Click "Send Message"
3. Enter an author like "user@example.com"
4. Enter a message like "Hello, this is a test message"
5. Click "Send"
6. Repeat to add more messages

## Step 6: Export to Intelligence (1 minute)

1. While viewing your conversation, click "📥 Export to Intelligence"
2. Select an Intelligence Service from the dropdown
3. Click "📥 Export"
4. Wait 2-3 seconds
5. The transcript will appear automatically!

## That's It!

You now have a fully functional Conversations App with Intelligence Export.

## What's Next?

- Add more messages to see richer transcripts
- Add participants to conversations
- Try exporting different conversations
- Explore the API endpoints in the README

## Troubleshooting

### "No Intelligence Services found"
- Go to Twilio Console → Intelligence
- Create a new Intelligence Service
- Refresh the app and try again

### "Failed to load services"
- Check that your credentials are correct
- Verify the server is running on port 3001
- Check server logs for errors

### Export not working
- Make sure your conversation has messages
- Verify the Intelligence Service SID is correct
- Wait a few seconds for processing

## Testing the Export Endpoint

Want to verify everything is working? Run the test script:

```bash
cd server
npm test
```

This will test all the endpoints including the export functionality.

## Remember

The `/Export` endpoint is **part of the Conversations API** - it exports conversation messages (chat, WhatsApp, SMS), NOT voice call transcriptions!
