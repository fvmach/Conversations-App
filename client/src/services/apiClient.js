const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    // Credentials managed server-side
  }

  // Send credentials to server
  async saveCredentials(accountSid, authToken, apiKey = null, apiSecret = null) {
    const credentials = { accountSid, authToken, apiKey, apiSecret };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save credentials');
      return data;
    } catch (error) {
      console.error('Save credentials error:', error);
      throw error;
    }
  }

  async getCredentialsStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credentials/status`);
      return await response.json();
    } catch (error) {
      console.error('Get credentials status error:', error);
      return { hasCredentials: false };
    }
  }

  async clearCredentials() {
    try {
      await fetch(`${API_BASE_URL}/api/credentials`, { method: 'DELETE' });
    } catch (error) {
      console.error('Clear credentials error:', error);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  async list(resource) {
    return this.request(`/api/twilio/${resource}`, { method: 'GET' });
  }

  async get(resource, id) {
    return this.request(`/api/twilio/${resource}/${id}`, { method: 'GET' });
  }

  async create(resource, data) {
    return this.request(`/api/twilio/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(resource, id, data) {
    return this.request(`/api/twilio/${resource}/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async delete(resource, id) {
    return this.request(`/api/twilio/${resource}/${id}`, {
      method: 'DELETE',
    });
  }

  conversations = {
    // Services
    listServices: () => this.list('conversations/services'),
    getService: (id) => this.get('conversations/services', id),
    createService: (data) => this.create('conversations/services', data),
    updateService: (id, data) => this.update('conversations/services', id, data),
    deleteService: (id) => this.delete('conversations/services', id),
    
    // Service-scoped conversations
    listServiceConversations: (serviceSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations`, { method: 'GET' }),
    getServiceConversation: (serviceSid, conversationSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}`, { method: 'GET' }),
    createServiceConversation: (serviceSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateServiceConversation: (serviceSid, conversationSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    deleteServiceConversation: (serviceSid, conversationSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}`, {
      method: 'DELETE',
    }),
    bulkCloseConversations: (serviceSid, conversationSids) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/bulk-close`, {
      method: 'POST',
      body: JSON.stringify({ conversationSids }),
    }),
    
    // Service-scoped messages
    listServiceMessages: (serviceSid, conversationSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/messages`, { method: 'GET' }),
    sendServiceMessage: (serviceSid, conversationSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // Service-scoped participants
    listServiceParticipants: (serviceSid, conversationSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/participants`, { method: 'GET' }),
    addServiceParticipant: (serviceSid, conversationSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/participants`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    deleteServiceParticipant: (serviceSid, conversationSid, participantSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/participants/${participantSid}`, {
      method: 'DELETE',
    }),
    
    // Message operations
    updateServiceMessage: (serviceSid, conversationSid, messageSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/messages/${messageSid}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    deleteServiceMessage: (serviceSid, conversationSid, messageSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/messages/${messageSid}`, {
      method: 'DELETE',
    }),
    
    // Webhooks operations
    listServiceWebhooks: (serviceSid, conversationSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/webhooks`, { method: 'GET' }),
    createServiceWebhook: (serviceSid, conversationSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateServiceWebhook: (serviceSid, conversationSid, webhookSid, data) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/webhooks/${webhookSid}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    deleteServiceWebhook: (serviceSid, conversationSid, webhookSid) => this.request(`/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/webhooks/${webhookSid}`, {
      method: 'DELETE',
    }),
    
    // CONVERSATIONAL INTELLIGENCE EXPORT
    // This exports Conversations (not Voice) to Intelligence Service
    exportToIntelligence: (serviceSid, conversationSid, intelligenceServiceSid) => {
      const url = `/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/export`;
      console.log('[API Client Export] Calling:', url);
      console.log('[API Client Export] Service SID:', serviceSid);
      console.log('[API Client Export] Conversation SID:', conversationSid);
      console.log('[API Client Export] Intelligence Service SID:', intelligenceServiceSid);
      return this.request(url, {
        method: 'POST',
        body: JSON.stringify({ intelligenceServiceSid }),
      });
    },
  };

  intelligence = {
    listServices: () => this.list('intelligence/services'),
    getOperatorResults: (transcriptSid) => this.request(`/api/twilio/intelligence/transcripts/${transcriptSid}/operatorResults`, { method: 'GET' }),
  };

  // WhatsApp Groups - calls Twilio Serverless functions
  whatsapp = {
    baseUrl: 'https://whatsapp-group-messaging-1361.twil.io',
    
    // Contact Management (via Sync)
    listContacts: async () => {
      const response = await fetch(`${this.whatsapp.baseUrl}/sync-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' })
      });
      if (!response.ok) throw new Error('Failed to list contacts');
      const data = await response.json();
      return data.contacts || [];
    },
    
    createContact: async (contactData) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/sync-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ...contactData })
      });
      if (!response.ok) throw new Error('Failed to create contact');
      return response.json();
    },
    
    updateContact: async (contactId, contactData) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/sync-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', contactId, ...contactData })
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    
    deleteContact: async (contactId) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/sync-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', contactId })
      });
      if (!response.ok) throw new Error('Failed to delete contact');
      return response.json();
    },
    
    // Group Management
    createGroup: async (groupData) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/createGroupConversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    
    getConversations: async (identity) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/getConversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity })
      });
      if (!response.ok) throw new Error('Failed to get conversations');
      return response.json();
    },
    
    notifyGroup: async (conversationSid, message, from) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/notifyGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationSid, message, from })
      });
      if (!response.ok) throw new Error('Failed to notify group');
      return response.json();
    },
    
    addParticipants: async (conversationSid, participants, twilioNumber, templateSid) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/addGroupParticipants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationSid, participants, twilioNumber, templateSid })
      });
      if (!response.ok) throw new Error('Failed to add participants');
      return response.json();
    },
    
    removeParticipant: async (conversationSid, participantSid) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/removeGroupParticipant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationSid, participantSid })
      });
      if (!response.ok) throw new Error('Failed to remove participant');
      return response.json();
    },
    
    updateGroup: async (conversationSid, name, description) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/updateGroupDetails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationSid, name, description })
      });
      if (!response.ok) throw new Error('Failed to update group');
      return response.json();
    },
    
    archiveGroup: async (conversationSid) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/archiveGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationSid })
      });
      if (!response.ok) throw new Error('Failed to archive group');
      return response.json();
    },
    
    deleteGroup: async (conversationSid) => {
      const response = await fetch(`${this.whatsapp.baseUrl}/deleteGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationSid })
      });
      if (!response.ok) throw new Error('Failed to delete group');
      return response.json();
    }
  };
}

export default new ApiClient();
