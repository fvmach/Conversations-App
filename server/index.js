const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store credentials in a file (in production, use a secure secret manager)
const CREDS_FILE = path.join(__dirname, '.credentials.json');

// Load credentials from file
function loadCredentials() {
  try {
    if (fs.existsSync(CREDS_FILE)) {
      const data = fs.readFileSync(CREDS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
  return null;
}

// Save credentials to file
function saveCredentials(credentials) {
  try {
    fs.writeFileSync(CREDS_FILE, JSON.stringify(credentials, null, 2));
    console.log('Credentials saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving credentials:', error);
    return false;
  }
}

// Middleware to create Twilio client from stored credentials
const validateCredentials = (req, res, next) => {
  const credentials = loadCredentials();
  
  if (!credentials || !credentials.accountSid) {
    return res.status(401).json({ 
      error: 'No credentials configured. Please set up credentials via /api/credentials endpoint.' 
    });
  }
  
  try {
    // Support both Auth Token and API Key authentication
    if (credentials.apiKey && credentials.apiSecret) {
      console.log('Using API Key authentication');
      req.twilioClient = twilio(credentials.apiKey, credentials.apiSecret, { 
        accountSid: credentials.accountSid 
      });
    } else if (credentials.authToken) {
      console.log('Using Auth Token authentication');
      req.twilioClient = twilio(credentials.accountSid, credentials.authToken);
    } else {
      return res.status(401).json({ 
        error: 'Invalid credentials format. Need either authToken or both apiKey and apiSecret.' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to initialize Twilio client: ' + error.message });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Credentials management endpoints
app.post('/api/credentials', (req, res) => {
  const { accountSid, authToken, apiKey, apiSecret } = req.body;
  
  if (!accountSid) {
    return res.status(400).json({ error: 'Account SID is required' });
  }
  
  if (!authToken && !(apiKey && apiSecret)) {
    return res.status(400).json({ 
      error: 'Either authToken or both apiKey and apiSecret are required' 
    });
  }
  
  const credentials = { accountSid, authToken, apiKey, apiSecret };
  
  if (saveCredentials(credentials)) {
    res.json({ 
      success: true, 
      message: 'Credentials saved successfully',
      hasCredentials: true
    });
  } else {
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

app.get('/api/credentials/status', (req, res) => {
  const credentials = loadCredentials();
  res.json({ 
    hasCredentials: !!(credentials && credentials.accountSid),
    accountSid: credentials?.accountSid ? credentials.accountSid.substring(0, 10) + '...' : null,
    authMethod: credentials?.apiKey ? 'API Key' : credentials?.authToken ? 'Auth Token' : null
  });
});

app.delete('/api/credentials', (req, res) => {
  try {
    if (fs.existsSync(CREDS_FILE)) {
      fs.unlinkSync(CREDS_FILE);
    }
    res.json({ success: true, message: 'Credentials cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear credentials' });
  }
});

// Conversation Services endpoints
app.get('/api/twilio/conversations/services', validateCredentials, async (req, res) => {
  try {
    const services = await req.twilioClient.conversations.v1.services.list();
    res.json(services);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services', validateCredentials, async (req, res) => {
  try {
    const service = await req.twilioClient.conversations.v1.services.create(req.body);
    res.json(service);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:sid', validateCredentials, async (req, res) => {
  try {
    const service = await req.twilioClient.conversations.v1.services(req.params.sid).update(req.body);
    res.json(service);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.delete('/api/twilio/conversations/services/:sid', validateCredentials, async (req, res) => {
  try {
    await req.twilioClient.conversations.v1.services(req.params.sid).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Service-scoped conversations with pagination support
app.get('/api/twilio/conversations/services/:serviceSid/conversations', validateCredentials, async (req, res) => {
  try {
    const { pageSize, page } = req.query;
    const options = {};
    
    // Add pagination parameters if provided
    if (pageSize) {
      options.pageSize = parseInt(pageSize, 10);
    }
    
    const conversations = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations.list(options);
    res.json(conversations);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations', validateCredentials, async (req, res) => {
  try {
    const conversation = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations.create(req.body);
    res.json(conversation);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid', validateCredentials, async (req, res) => {
  try {
    const conversation = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).fetch();
    res.json(conversation);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid', validateCredentials, async (req, res) => {
  try {
    const conversation = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).update(req.body);
    res.json(conversation);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.delete('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid', validateCredentials, async (req, res) => {
  try {
    await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Bulk archive conversations
app.post('/api/twilio/conversations/services/:serviceSid/conversations/bulk-archive', validateCredentials, async (req, res) => {
  try {
    const { conversationSids } = req.body;
    
    if (!conversationSids || !Array.isArray(conversationSids) || conversationSids.length === 0) {
      return res.status(400).json({ error: 'conversationSids array is required and must not be empty' });
    }
    
    console.log(`[Bulk Archive] Archiving ${conversationSids.length} conversations`);
    
    const results = {
      successful: [],
      failed: []
    };
    
    // Archive conversations in parallel with Promise.allSettled for better error handling
    const promises = conversationSids.map(async (conversationSid) => {
      try {
        await req.twilioClient.conversations.v1.services(req.params.serviceSid)
          .conversations(conversationSid)
          .update({ state: 'inactive' });
        return { success: true, sid: conversationSid };
      } catch (error) {
        return { success: false, sid: conversationSid, error: error.message };
      }
    });
    
    const responses = await Promise.allSettled(promises);
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        if (response.value.success) {
          results.successful.push(response.value.sid);
        } else {
          results.failed.push({
            sid: response.value.sid,
            error: response.value.error
          });
        }
      } else {
        results.failed.push({
          sid: conversationSids[index],
          error: response.reason?.message || 'Unknown error'
        });
      }
    });
    
    console.log(`[Bulk Archive] Results: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    res.json({
      success: true,
      archived: results.successful.length,
      failed: results.failed.length,
      details: results
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Service-scoped conversation messages
app.get('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/messages', validateCredentials, async (req, res) => {
  try {
    const messages = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).messages.list();
    res.json(messages);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/messages', validateCredentials, async (req, res) => {
  try {
    const message = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).messages.create(req.body);
    res.json(message);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Service-scoped conversation participants
app.get('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/participants', validateCredentials, async (req, res) => {
  try {
    const participants = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).participants.list();
    res.json(participants);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/participants', validateCredentials, async (req, res) => {
  try {
    const participant = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).participants.create(req.body);
    res.json(participant);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.delete('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/participants/:participantSid', validateCredentials, async (req, res) => {
  try {
    await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).participants(req.params.participantSid).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Message operations
app.delete('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/messages/:messageSid', validateCredentials, async (req, res) => {
  try {
    await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).messages(req.params.messageSid).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/messages/:messageSid', validateCredentials, async (req, res) => {
  try {
    const message = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).messages(req.params.messageSid).update(req.body);
    res.json(message);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Webhooks operations
app.get('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks', validateCredentials, async (req, res) => {
  try {
    const webhooks = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).webhooks.list();
    res.json(webhooks);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks', validateCredentials, async (req, res) => {
  try {
    const webhook = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).webhooks.create(req.body);
    res.json(webhook);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks/:webhookSid', validateCredentials, async (req, res) => {
  try {
    const webhook = await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).webhooks(req.params.webhookSid).update(req.body);
    res.json(webhook);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.delete('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks/:webhookSid', validateCredentials, async (req, res) => {
  try {
    await req.twilioClient.conversations.v1.services(req.params.serviceSid).conversations(req.params.conversationSid).webhooks(req.params.webhookSid).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// CONVERSATIONAL INTELLIGENCE EXPORT ENDPOINT
// This is the key endpoint for exporting Conversations (not Voice) to Intelligence Service
// The /Export endpoint is part of the Conversations API
app.post('/api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/export', validateCredentials, async (req, res) => {
  try {
    console.log('[SERVER Export] Received export request');
    console.log('[SERVER Export] Conversation Service SID:', req.params.serviceSid);
    console.log('[SERVER Export] Conversation SID:', req.params.conversationSid);
    console.log('[SERVER Export] Request body:', req.body);
    
    const { intelligenceServiceSid } = req.body;
    
    if (!intelligenceServiceSid) {
      console.error('[SERVER Export] Missing intelligenceServiceSid');
      return res.status(400).json({ error: 'IntelligenceServiceSid is required' });
    }
    
    console.log('[SERVER Export] Intelligence Service SID:', intelligenceServiceSid);
    
    // Get credentials
    const credentials = loadCredentials();
    const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
    
    // Use the Conversations API Export endpoint (part of Conversations API, not Voice)
    // This exports chat/WhatsApp/Conversations-API conversations (NOT Voice)
    const exportUrl = `https://conversations.twilio.com/v1/Services/${req.params.serviceSid}/Conversations/${req.params.conversationSid}/Export`;
    console.log('[SERVER Export] Calling Twilio API:', exportUrl);
    console.log('[SERVER Export] With IntelligenceServiceSid:', intelligenceServiceSid);
    
    const response = await axios.post(
      exportUrl,
      `IntelligenceServiceSid=${intelligenceServiceSid}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('[SERVER Export] Success! Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('[SERVER Export] ERROR:', error.response?.data || error.message);
    console.error('[SERVER Export] Full error:', error);
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
});

// Intelligence Services endpoints
app.get('/api/twilio/intelligence/services', validateCredentials, async (req, res) => {
  try {
    // Use the Twilio Intelligence v2 API
    const services = await req.twilioClient.intelligence.v2.services.list({ limit: 100 });
    res.json({ services });
  } catch (error) {
    console.error('Intelligence services error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});



// Get Intelligence Transcript Operator Results (AI analysis results)
app.get('/api/twilio/intelligence/transcripts/:transcriptSid/operatorResults', validateCredentials, async (req, res) => {
  try {
    const operatorResults = await req.twilioClient.intelligence.v2.transcripts(req.params.transcriptSid).operatorResults.list({ limit: 1000 });
    res.json({ operatorResults });
  } catch (error) {
    console.error('Operator results error:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Conversations App Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
