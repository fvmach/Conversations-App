# API Reference - Complete CRUD Operations

## Overview

The server now provides **full CRUD operations** for all Conversations resources:
- Services
- Conversations  
- Messages
- Participants
- Webhooks

Plus Intelligence integration for operator results.

## Base URL

```
http://localhost:3001/api/twilio
```

## Authentication

All endpoints require credentials to be configured via `/api/credentials`.

---

## Conversation Services

### List Services
```
GET /conversations/services
```

### Create Service
```
POST /conversations/services
Body: { "friendlyName": "My Service" }
```

### Update Service
```
POST /conversations/services/:sid
Body: { "friendlyName": "Updated Name" }
```

### Delete Service
```
DELETE /conversations/services/:sid
```

---

## Conversations (Service-scoped)

### List Conversations
```
GET /conversations/services/:serviceSid/conversations
```

### Get Conversation
```
GET /conversations/services/:serviceSid/conversations/:conversationSid
```

### Create Conversation
```
POST /conversations/services/:serviceSid/conversations
Body: { 
  "friendlyName": "My Conversation",
  "uniqueName": "my-conversation"
}
```

### Update Conversation
```
POST /conversations/services/:serviceSid/conversations/:conversationSid
Body: { "friendlyName": "Updated Name" }
```

### Delete Conversation
```
DELETE /conversations/services/:serviceSid/conversations/:conversationSid
```

---

## Messages

### List Messages
```
GET /conversations/services/:serviceSid/conversations/:conversationSid/messages
```

### Send Message
```
POST /conversations/services/:serviceSid/conversations/:conversationSid/messages
Body: {
  "author": "user@example.com",
  "body": "Message content"
}
```

### Update Message
```
POST /conversations/services/:serviceSid/conversations/:conversationSid/messages/:messageSid
Body: {
  "body": "Updated content",
  "attributes": "{\"key\":\"value\"}"
}
```

### Delete Message
```
DELETE /conversations/services/:serviceSid/conversations/:conversationSid/messages/:messageSid
```

---

## Participants

### List Participants
```
GET /conversations/services/:serviceSid/conversations/:conversationSid/participants
```

### Add Participant
```
POST /conversations/services/:serviceSid/conversations/:conversationSid/participants
Body: {
  "identity": "user@example.com",
  "messagingBinding.address": "+15551234567",
  "messagingBinding.proxyAddress": "+15559876543"
}
```

### Delete Participant
```
DELETE /conversations/services/:serviceSid/conversations/:conversationSid/participants/:participantSid
```

---

## Webhooks

### List Webhooks
```
GET /conversations/services/:serviceSid/conversations/:conversationSid/webhooks
```

### Create Webhook
```
POST /conversations/services/:serviceSid/conversations/:conversationSid/webhooks
Body: {
  "target": "webhook",
  "configuration.url": "https://example.com/webhook",
  "configuration.method": "POST",
  "configuration.filters": ["onMessageAdded"]
}
```

### Update Webhook
```
POST /conversations/services/:serviceSid/conversations/:conversationSid/webhooks/:webhookSid
Body: {
  "configuration.url": "https://example.com/new-webhook"
}
```

### Delete Webhook
```
DELETE /conversations/services/:serviceSid/conversations/:conversationSid/webhooks/:webhookSid
```

---

## Intelligence Integration

### Export Conversation to Intelligence
```
POST /conversations/services/:serviceSid/conversations/:conversationSid/export
Body: {
  "intelligenceServiceSid": "GAxxxxxx"
}

Response: {
  "transcript_sid": "GTxxxxxx",
  "status": "queued"
}
```

### List Intelligence Services
```
GET /intelligence/services

Response: {
  "services": [
    {
      "sid": "GAxxxxxx",
      "uniqueName": "my-service",
      "friendlyName": "My Intelligence Service",
      "languageCode": "en-US"
    }
  ]
}
```

### Get Transcript
```
GET /intelligence/transcripts/:transcriptSid
```

### Get Operator Results (AI Analysis)
```
GET /intelligence/transcripts/:transcriptSid/operatorResults

Response: {
  "operatorResults": [
    {
      "name": "Conversation Summary",
      "operatorType": "text-generation",
      "textGenerationResults": "The customer inquired about..."
    },
    {
      "name": "Topic Classification",
      "operatorType": "conversation-classify",
      "predictedLabel": "Technical Support",
      "predictedProbability": 0.95
    }
  ]
}
```

---

## API Client Usage (JavaScript)

The client-side API client (`client/src/services/apiClient.js`) provides methods for all operations:

### Services
```javascript
await apiClient.conversations.listServices()
await apiClient.conversations.createService({ friendlyName: "My Service" })
await apiClient.conversations.updateService(sid, { friendlyName: "Updated" })
await apiClient.conversations.deleteService(sid)
```

### Conversations
```javascript
await apiClient.conversations.listServiceConversations(serviceSid)
await apiClient.conversations.createServiceConversation(serviceSid, data)
await apiClient.conversations.updateServiceConversation(serviceSid, conversationSid, data)
await apiClient.conversations.deleteServiceConversation(serviceSid, conversationSid)
```

### Messages
```javascript
await apiClient.conversations.listServiceMessages(serviceSid, conversationSid)
await apiClient.conversations.sendServiceMessage(serviceSid, conversationSid, data)
await apiClient.conversations.updateServiceMessage(serviceSid, conversationSid, messageSid, data)
await apiClient.conversations.deleteServiceMessage(serviceSid, conversationSid, messageSid)
```

### Participants
```javascript
await apiClient.conversations.listServiceParticipants(serviceSid, conversationSid)
await apiClient.conversations.addServiceParticipant(serviceSid, conversationSid, data)
await apiClient.conversations.deleteServiceParticipant(serviceSid, conversationSid, participantSid)
```

### Webhooks
```javascript
await apiClient.conversations.listServiceWebhooks(serviceSid, conversationSid)
await apiClient.conversations.createServiceWebhook(serviceSid, conversationSid, data)
await apiClient.conversations.updateServiceWebhook(serviceSid, conversationSid, webhookSid, data)
await apiClient.conversations.deleteServiceWebhook(serviceSid, conversationSid, webhookSid)
```

### Intelligence
```javascript
await apiClient.conversations.exportToIntelligence(serviceSid, conversationSid, intelligenceServiceSid)
await apiClient.intelligence.listServices()
await apiClient.intelligence.getTranscript(transcriptSid)
await apiClient.intelligence.getOperatorResults(transcriptSid)
```

---

## Complete Feature Matrix

| Resource | List | Get | Create | Update | Delete |
|----------|------|-----|--------|--------|--------|
| Services | Yes | No | Yes | Yes | Yes |
| Conversations | Yes | Yes | Yes | Yes | Yes |
| Messages | Yes | No | Yes | Yes | Yes |
| Participants | Yes | No | Yes | No | Yes |
| Webhooks | Yes | No | Yes | Yes | Yes |
| Intelligence | Yes | Yes | Export | No | No |

---

## Notes

- All endpoints return JSON
- Error responses include `{ "error": "Error message" }`
- Success responses for DELETE operations return `{ "success": true }`
- The Export endpoint is part of the Conversations API and exports conversation messages (chat, WhatsApp, SMS), NOT voice transcriptions
- Operator Results contain AI analysis like summaries, classifications, and extractions from Intelligence operators

## Testing

Use the test script to verify endpoints:
```bash
cd server
npm test
```

Or test individual endpoints with curl:
```bash
# List services
curl http://localhost:3001/api/twilio/conversations/services

# Export conversation
curl -X POST http://localhost:3001/api/twilio/conversations/services/ISxxx/conversations/CHxxx/export \
  -H "Content-Type: application/json" \
  -d '{"intelligenceServiceSid":"GAxxx"}'
```
