# Webhook and Participant CRUD Implementation

This document summarizes the implementation of complete CRUD operations for webhooks and view functionality for participants in the Conversations App.

## Overview

The implementation adds full functionality to the View/Edit buttons that were previously displayed in the participants and webhooks tables but had no handlers. Users can now:

- **View participant details** in a read-only modal
- **View webhook details** in a read-only modal
- **Create new webhooks** with target URL, HTTP method, and event filters
- **Edit existing webhooks** with all configuration options
- **Delete webhooks** with confirmation

## Changes Made

### 1. Handler Functions (lines 716-838)

#### Participant Handlers
- `handleViewParticipant(participant)` - Opens the participant details modal

#### Webhook Handlers
- `handleViewWebhook(webhook)` - Opens the webhook details modal
- `handleEditWebhook(webhook)` - Opens the webhook edit modal with pre-filled data
- `handleDeleteWebhook(webhookSid)` - Deletes a webhook with confirmation
- `handleCreateWebhook(e)` - Creates a new webhook from form data
- `handleUpdateWebhook(e)` - Updates an existing webhook from form data

### 2. Participant Details Modal (lines 2176-2218)

Read-only modal displaying:
- SID (conversation-scoped identifier)
- Identity
- Role SID
- Messaging binding details (type, address, proxy address)
- Date created
- Custom attributes (formatted JSON or error message for invalid JSON)

**Features:**
- Handles empty, invalid, or missing attributes gracefully
- Displays messaging binding information when available
- Clean, formatted JSON display for attributes

### 3. Webhook Details Modal (lines 2220-2242)

Read-only modal displaying:
- SID
- Target URL
- HTTP method
- Event filters (or "None" if not set)
- Date created
- Date updated (if available)

**Features:**
- Quick access to Edit mode via button in modal
- Supports both `target` and `url` properties from API

### 4. Webhook Create/Edit Modal (lines 2017-2073)

Form modal with fields:
- **Target URL** (required, type=url) - The webhook endpoint
- **HTTP Method** (required, dropdown) - POST or GET
- **Event Filters** (optional, text input) - Comma-separated event names

**Features:**
- Reuses same modal for both create and edit operations
- Shows appropriate title based on mode ("Create Webhook" vs "Edit Webhook")
- Pre-fills form when editing existing webhook
- Clears form on cancel/close
- Parses comma-separated filters into array for API

### 5. API Client Methods

The following methods were already present in `apiClient.js` and are utilized by the handlers:

```javascript
listServiceWebhooks(serviceSid, conversationSid)
createServiceWebhook(serviceSid, conversationSid, data)
updateServiceWebhook(serviceSid, conversationSid, webhookSid, data)
deleteServiceWebhook(serviceSid, conversationSid, webhookSid)
```

## Backend Endpoints

Conversation-level webhook endpoints (already implemented in `server/index.js`):

- `GET /api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks`
- `POST /api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks`
- `POST /api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks/:webhookSid`
- `DELETE /api/twilio/conversations/services/:serviceSid/conversations/:conversationSid/webhooks/:webhookSid`

Service-level webhook endpoints (lines 498-570):

- `GET /api/twilio/conversations/services/:serviceSid/webhooks`
- `POST /api/twilio/conversations/services/:serviceSid/webhooks`
- `GET /api/twilio/conversations/services/:serviceSid/webhooks/:webhookSid`
- `POST /api/twilio/conversations/services/:serviceSid/webhooks/:webhookSid`
- `DELETE /api/twilio/conversations/services/:serviceSid/webhooks/:webhookSid`

## User Workflow

### Viewing Participant Details
1. Navigate to a conversation detail view
2. Find a participant in the Participants table
3. Click "View" button
4. Modal displays all participant information
5. Click "Close" to dismiss

### Creating a Webhook
1. Navigate to a conversation detail view
2. Click "Add Webhook" button in Webhooks section
3. Enter target URL (required)
4. Select HTTP method (POST/GET)
5. Optionally enter comma-separated event filters
6. Click "Create"
7. Webhook is created and table refreshes

### Viewing Webhook Details
1. Find a webhook in the Webhooks table
2. Click "View" button
3. Modal displays full webhook configuration
4. Optionally click "Edit" to switch to edit mode
5. Click "Close" to dismiss

### Editing a Webhook
1. Find a webhook in the Webhooks table
2. Click "Edit" button (or "Edit" from view modal)
3. Modify target URL, method, or filters as needed
4. Click "Update"
5. Webhook is updated and table refreshes

### Deleting a Webhook
1. Find a webhook in the Webhooks table
2. Click "Delete" button
3. Confirm deletion in browser prompt
4. Webhook is removed and table refreshes

## Data Format

### Webhook Data Structure
```javascript
{
  target: "https://example.com/webhook",
  method: "POST",
  filters: ["onMessageAdded", "onConversationAdded"]
}
```

**Notes:**
- `filters` is sent as an array to the API
- The form accepts comma-separated values and converts them to an array
- Empty filters field results in no `filters` property (webhook receives all events)

### Participant Data Structure
Participants are read-only and display data from the API:
```javascript
{
  sid: "MB...",
  identity: "user@example.com",
  roleSid: "RL...",
  messagingBinding: {
    type: "sms",
    address: "+15551234567",
    proxy_address: "+15559876543"
  },
  dateCreated: "2024-12-15T...",
  attributes: "{\"key\":\"value\"}"
}
```

## Error Handling

- All operations include try-catch blocks
- Errors are displayed via the global error state
- Success messages confirm completed operations
- Cache invalidation ensures data stays fresh after mutations
- Invalid JSON in participant attributes is handled gracefully

## State Management

All modals use existing state variables:
- `showParticipantDetailsModal` / `viewingParticipant`
- `showWebhookDetailsModal` / `viewingWebhook`
- `showWebhookModal` / `editingItem` / `webhookForm`

Form data is cleared on modal close to prevent stale data.

## Testing Verification

Build completed successfully with no errors:
```
✓ 45 modules transformed.
dist/index.html                   0.43 kB │ gzip:  0.29 kB
dist/assets/index-BxT-J2hM.css    4.17 kB │ gzip:  1.42 kB
dist/assets/index--I31UHRg.js   236.64 kB │ gzip: 69.83 kB
✓ built in 398ms
```

## Next Steps

Consider adding:
1. Service-level webhook management UI (separate view from conversation-level)
2. Webhook event log/history viewer
3. Participant role management (update role SID)
4. Participant attributes editing
5. Webhook testing tool (send test payload)
6. Validation for webhook URL reachability
7. Webhook secret/authentication configuration
