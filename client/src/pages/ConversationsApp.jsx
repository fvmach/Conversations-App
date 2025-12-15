import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import '../styles/ConversationsApp.css';

const ConversationsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRestoringState, setIsRestoringState] = useState(true);
  
  // View states
  const [currentView, setCurrentView] = useState('services');
  
  // Services state
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  
  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  // Sub-resources
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  
  // Intelligence state
  const [intelligenceServices, setIntelligenceServices] = useState([]);
  const [selectedIntelligenceService, setSelectedIntelligenceService] = useState('');
  const [exportResult, setExportResult] = useState(null);
  const [operatorResults, setOperatorResults] = useState(null);
  const [loadingOperatorResults, setLoadingOperatorResults] = useState(false);
  
  // Modal states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOperatorResultsModal, setShowOperatorResultsModal] = useState(false);
  const [viewingOperatorResults, setViewingOperatorResults] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [serviceForm, setServiceForm] = useState({ friendlyName: '' });
  const [conversationForm, setConversationForm] = useState({ friendlyName: '', uniqueName: '', attributes: '' });
  const [messageForm, setMessageForm] = useState({ author: '', body: '', attributes: '' });
  const [participantForm, setParticipantForm] = useState({ identity: '', attributes: '' });

  // Helper to load filter preferences from localStorage
  const loadFilterPreferences = () => {
    const saved = localStorage.getItem('conversationsAppFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const savedFilters = loadFilterPreferences();

  // Search/Filter states with localStorage initialization
  const [conversationSearch, setConversationSearch] = useState(savedFilters.conversationSearch || '');
  const [messageSearch, setMessageSearch] = useState(savedFilters.messageSearch || '');
  const [participantSearch, setParticipantSearch] = useState(savedFilters.participantSearch || '');
  const [conversationSortBy, setConversationSortBy] = useState(savedFilters.conversationSortBy || 'dateCreated');
  const [conversationSortOrder, setConversationSortOrder] = useState(savedFilters.conversationSortOrder || 'desc');
  const [conversationStateFilter, setConversationStateFilter] = useState(savedFilters.conversationStateFilter || 'all');
  const [conversationDateFrom, setConversationDateFrom] = useState(savedFilters.conversationDateFrom || '');
  const [conversationDateTo, setConversationDateTo] = useState(savedFilters.conversationDateTo || '');

  // Cache utility functions
  const invalidateCache = (pattern) => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  };

  // Filter and sort functions
  const filterConversations = (convs) => {
    return convs.filter(conv => {
      // Filter by state
      if (conversationStateFilter !== 'all' && conv.state !== conversationStateFilter) {
        return false;
      }
      
      // Filter by date range
      if (conversationDateFrom) {
        const convDate = new Date(conv.dateCreated);
        const fromDate = new Date(conversationDateFrom);
        if (convDate < fromDate) return false;
      }
      
      if (conversationDateTo) {
        const convDate = new Date(conv.dateCreated);
        const toDate = new Date(conversationDateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (convDate > toDate) return false;
      }
      
      // Text search
      if (!conversationSearch.trim()) return true;
      
      const search = conversationSearch.toLowerCase();
      
      // Search in friendly name
      if (conv.friendlyName?.toLowerCase().includes(search)) return true;
      
      // Search in unique name
      if (conv.uniqueName?.toLowerCase().includes(search)) return true;
      
      // Search in attributes
      if (conv.attributes) {
        try {
          const attrs = JSON.parse(conv.attributes);
          const attrsString = JSON.stringify(attrs).toLowerCase();
          if (attrsString.includes(search)) return true;
        } catch (e) {
          // Invalid JSON, skip
        }
      }
      
      // Search in participants (if we have participant data cached)
      if (conv.participants && conv.participants.length > 0) {
        const hasMatchingParticipant = conv.participants.some(p => 
          p.identity?.toLowerCase().includes(search) ||
          p.messagingBinding?.address?.toLowerCase().includes(search)
        );
        if (hasMatchingParticipant) return true;
      }
      
      return false;
    });
  };

  const sortConversations = (convs) => {
    const sorted = [...convs];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      switch (conversationSortBy) {
        case 'name':
          aVal = (a.friendlyName || a.uniqueName || a.sid).toLowerCase();
          bVal = (b.friendlyName || b.uniqueName || b.sid).toLowerCase();
          break;
        case 'state':
          aVal = a.state;
          bVal = b.state;
          break;
        case 'participants':
          aVal = a.participantsCount || 0;
          bVal = b.participantsCount || 0;
          break;
        case 'dateCreated':
        default:
          aVal = new Date(a.dateCreated).getTime();
          bVal = new Date(b.dateCreated).getTime();
      }
      
      if (aVal < bVal) return conversationSortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return conversationSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const filterMessages = (msgs) => {
    if (!messageSearch.trim()) return msgs;
    
    const search = messageSearch.toLowerCase();
    return msgs.filter(msg => {
      // Search in body
      if (msg.body?.toLowerCase().includes(search)) return true;
      
      // Search in author
      if (msg.author?.toLowerCase().includes(search)) return true;
      
      return false;
    });
  };

  const filterParticipants = (parts) => {
    if (!participantSearch.trim()) return parts;
    
    const search = participantSearch.toLowerCase();
    return parts.filter(part => {
      // Search in identity
      if (part.identity?.toLowerCase().includes(search)) return true;
      
      // Search in messaging binding address
      if (part.messagingBinding?.address?.toLowerCase().includes(search)) return true;
      
      return false;
    });
  };

  // Don't load on mount - RequireCredentials will handle the initial state
  // Services and intelligence will load after credentials are saved

  // Load data after component mounts and restore navigation state
  useEffect(() => {
    const checkAndLoad = async () => {
      const status = await apiClient.getCredentialsStatus();
      if (status.hasCredentials) {
        // Load services first
        const servicesData = await loadServicesData();
        loadIntelligenceServices();
        
        // Restore navigation state from localStorage
        const savedState = localStorage.getItem('conversationsAppState');
        if (savedState && servicesData) {
          try {
            const state = JSON.parse(savedState);
            console.log('[Restore] Attempting to restore state:', state.currentView);
            
            // Restore service if we have one saved
            if (state.selectedService) {
              const service = servicesData.find(s => s.sid === state.selectedService.sid);
              if (service) {
                console.log('[Restore] Restoring service:', service.friendlyName);
                setSelectedService(service);
                
                // If we need to restore a conversation view, we'll load data in the next useEffect
                // but we need to set the view and conversation first
                if (state.currentView === 'conversations') {
                  setCurrentView('conversations');
                } else if (state.currentView === 'conversation-detail' && state.selectedConversation) {
                  // For conversation detail, we need to load conversations first to get the full data
                  console.log('[Restore] Restoring conversation detail view');
                  const cacheKey = `conversations_${service.sid}`;
                  const cached = localStorage.getItem(cacheKey);
                  
                  if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < 5 * 60 * 1000) {
                      setConversations(data);
                      const conversation = data.find(c => c.sid === state.selectedConversation.sid);
                      if (conversation) {
                        console.log('[Restore] Found conversation in cache:', conversation.friendlyName);
                        setSelectedConversation(conversation);
                        setCurrentView('conversation-detail');
                      } else {
                        console.log('[Restore] Conversation not found in cache, falling back to conversations view');
                        setCurrentView('conversations');
                      }
                    } else {
                      console.log('[Restore] Cache expired, falling back to conversations view');
                      setCurrentView('conversations');
                    }
                  } else {
                    console.log('[Restore] No cache found, falling back to conversations view');
                    setCurrentView('conversations');
                  }
                }
              } else {
                console.log('[Restore] Service not found, staying on services view');
              }
            } else {
              console.log('[Restore] No saved service, staying on services view');
            }
          } catch (err) {
            console.error('Failed to restore state:', err);
          }
        }
        // Mark restoration as complete
        setIsRestoringState(false);
      } else {
        setIsRestoringState(false);
      }
    };
    checkAndLoad();
  }, []);

  useEffect(() => {
    if (selectedService && currentView === 'conversations') {
      loadConversations();
    }
  }, [selectedService, currentView]);

  useEffect(() => {
    if (selectedService && selectedConversation && currentView === 'conversation-detail') {
      loadConversationDetails();
    }
  }, [selectedService, selectedConversation, currentView]);

  // Save navigation state to localStorage whenever it changes
  useEffect(() => {
    // Don't save state while we're restoring it
    if (isRestoringState) return;
    
    const state = {
      currentView,
      selectedService,
      selectedConversation
    };
    console.log('[Save] Saving state:', state.currentView);
    localStorage.setItem('conversationsAppState', JSON.stringify(state));
  }, [currentView, selectedService, selectedConversation, isRestoringState]);

  // Save filter preferences to localStorage whenever they change
  useEffect(() => {
    const filters = {
      conversationSearch,
      messageSearch,
      participantSearch,
      conversationSortBy,
      conversationSortOrder,
      conversationStateFilter,
      conversationDateFrom,
      conversationDateTo
    };
    localStorage.setItem('conversationsAppFilters', JSON.stringify(filters));
  }, [
    conversationSearch,
    messageSearch,
    participantSearch,
    conversationSortBy,
    conversationSortOrder,
    conversationStateFilter,
    conversationDateFrom,
    conversationDateTo
  ]);

  const loadServicesData = async (forceRefresh = false) => {
    // Helper function that returns the data directly
    try {
      const cacheKey = 'services';
      const cached = localStorage.getItem(cacheKey);
      
      if (!forceRefresh && cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setServices(data);
          return data;
        }
      }
      
      const data = await apiClient.conversations.listServices();
      setServices(data);
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    } catch (err) {
      setError('Failed to load services: ' + err.message);
      return null;
    }
  };

  const loadServices = async (forceRefresh = false) => {
    console.log('[LoadServices] Starting, forceRefresh:', forceRefresh);
    setLoading(true);
    setError('');
    try {
      const data = await loadServicesData(forceRefresh);
      console.log('[LoadServices] Loaded', data?.length, 'services');
    } finally {
      setLoading(false);
    }
  };

  const loadIntelligenceServices = async (forceRefresh = false) => {
    try {
      // Check cache first
      const cacheKey = 'intelligenceServices';
      const cached = localStorage.getItem(cacheKey);
      
      if (!forceRefresh && cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setIntelligenceServices(data);
          return;
        }
      }
      
      const data = await apiClient.intelligence.listServices();
      const services = data.services || data || [];
      setIntelligenceServices(services);
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({ data: services, timestamp: Date.now() }));
    } catch (err) {
      console.error('Failed to load intelligence services:', err);
    }
  };

  const loadConversations = async (forceRefresh = false) => {
    console.log('[LoadConversations] Starting for service:', selectedService?.sid, 'forceRefresh:', forceRefresh);
    setLoading(true);
    setError('');
    try {
      // Check cache first
      const cacheKey = `conversations_${selectedService.sid}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!forceRefresh && cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setConversations(data);
          setLoading(false);
          return;
        }
      }
      
      const data = await apiClient.conversations.listServiceConversations(selectedService.sid);
      console.log('[LoadConversations] Fetched', data?.length, 'conversations');
      
      // Fetch participant data for each conversation (for filtering)
      console.log('[LoadConversations] Fetching participant data...');
      const conversationsWithParticipants = await Promise.all(
        data.map(async (conversation) => {
          try {
            const participants = await apiClient.conversations.listServiceParticipants(
              selectedService.sid,
              conversation.sid
            );
            return {
              ...conversation,
              participantsCount: participants.length,
              participants: participants // Store participant data for filtering
            };
          } catch (err) {
            // If we can't get participants, just return the conversation without data
            return {
              ...conversation,
              participantsCount: 0,
              participants: []
            };
          }
        })
      );
      
      setConversations(conversationsWithParticipants);
      console.log('[LoadConversations] Complete with participant data');
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({ data: conversationsWithParticipants, timestamp: Date.now() }));
    } catch (err) {
      setError('Failed to load conversations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (forceRefresh = false) => {
    console.log('[LoadConversationDetails] Starting for conversation:', selectedConversation?.sid, 'forceRefresh:', forceRefresh);
    setLoading(true);
    try {
      const cacheKey = `conversation_details_${selectedConversation.sid}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!forceRefresh && cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setMessages(data.messages);
          setParticipants(data.participants);
          setWebhooks(data.webhooks);
          setLoading(false);
          
          // Still check for operator results
          checkForOperatorResults(forceRefresh);
          return;
        }
      }
      
      const [messagesData, participantsData, webhooksData] = await Promise.all([
        apiClient.conversations.listServiceMessages(selectedService.sid, selectedConversation.sid),
        apiClient.conversations.listServiceParticipants(selectedService.sid, selectedConversation.sid),
        apiClient.conversations.listServiceWebhooks(selectedService.sid, selectedConversation.sid).catch(() => [])
      ]);
      setMessages(messagesData);
      setParticipants(participantsData);
      setWebhooks(webhooksData || []);
      console.log('[LoadConversationDetails] Loaded:', messagesData?.length, 'messages,', participantsData?.length, 'participants,', webhooksData?.length, 'webhooks');
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({ 
        data: { 
          messages: messagesData, 
          participants: participantsData, 
          webhooks: webhooksData || [] 
        }, 
        timestamp: Date.now() 
      }));
      
      // Check for existing operator results from Intelligence
      checkForOperatorResults(forceRefresh);
    } catch (err) {
      setError('Failed to load conversation details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkForOperatorResults = async (forceRefresh = false) => {
    console.log('[CheckOperatorResults] Starting for conversation:', selectedConversation?.sid, 'forceRefresh:', forceRefresh);
    setLoadingOperatorResults(true);
    try {
      const cacheKey = `operator_results_${selectedConversation.sid}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!forceRefresh && cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setOperatorResults(data);
          setLoadingOperatorResults(false);
          return;
        }
      }
      
      // Check if we have a stored transcript SID for this conversation
      const transcriptMapKey = `transcript_map_${selectedConversation.sid}`;
      const transcriptMap = localStorage.getItem(transcriptMapKey);
      console.log('[CheckOperatorResults] Transcript mapping found:', !!transcriptMap);
      
      if (transcriptMap) {
        try {
          const { transcriptSid, intelligenceServiceName } = JSON.parse(transcriptMap);
          console.log('[CheckOperatorResults] Transcript SID:', transcriptSid, 'Service:', intelligenceServiceName);
          
          // Try to get operator results for this transcript
          const resultsResponse = await apiClient.intelligence.getOperatorResults(transcriptSid);
          const results = resultsResponse.operatorResults || resultsResponse || [];
          
          if (results.length > 0) {
            console.log('[CheckOperatorResults] Found', results.length, 'operator results');
            const operatorData = {
              transcriptSid,
              serviceName: intelligenceServiceName,
              results
            };
            setOperatorResults(operatorData);
            
            // Cache the result
            localStorage.setItem(cacheKey, JSON.stringify({ data: operatorData, timestamp: Date.now() }));
          } else {
            console.log('[CheckOperatorResults] No operator results found');
          }
        } catch (err) {
          console.log('Could not load operator results:', err.message);
          // Transcript might not be processed yet or doesn't exist anymore
        }
      }
    } catch (err) {
      console.log('Could not check for operator results:', err.message);
    } finally {
      setLoadingOperatorResults(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    console.log('[CreateService] Creating service:', serviceForm);
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.createService(serviceForm);
      console.log('[CreateService] Service created successfully');
      setSuccess('Service created successfully');
      setShowServiceModal(false);
      setServiceForm({ friendlyName: '' });
      invalidateCache('services');
      loadServices(true);
    } catch (err) {
      setError('Failed to create service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    console.log('[CreateConversation] Creating conversation for service:', selectedService?.sid, 'data:', conversationForm);
    setLoading(true);
    setError('');
    try {
      const data = { ...conversationForm };
      
      // Validate and parse attributes JSON if provided
      if (data.attributes && data.attributes.trim()) {
        try {
          JSON.parse(data.attributes);
        } catch (err) {
          setError('Invalid JSON in attributes field');
          setLoading(false);
          return;
        }
      }
      
      await apiClient.conversations.createServiceConversation(selectedService.sid, data);
      console.log('[CreateConversation] Conversation created successfully');
      setSuccess('Conversation created successfully');
      setShowConversationModal(false);
      setConversationForm({ friendlyName: '', uniqueName: '', attributes: '' });
      invalidateCache(`conversations_${selectedService.sid}`);
      loadConversations(true);
    } catch (err) {
      setError('Failed to create conversation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('[SendMessage] Sending message for conversation:', selectedConversation?.sid, 'data:', messageForm);
    setLoading(true);
    setError('');
    try {
      const data = { ...messageForm };
      
      // Validate and parse attributes JSON if provided
      if (data.attributes && data.attributes.trim()) {
        try {
          JSON.parse(data.attributes);
        } catch (err) {
          setError('Invalid JSON in attributes field');
          setLoading(false);
          return;
        }
      }
      
      await apiClient.conversations.sendServiceMessage(selectedService.sid, selectedConversation.sid, data);
      setSuccess('Message sent successfully');
      setShowMessageModal(false);
      setMessageForm({ author: '', body: '', attributes: '' });
      invalidateCache(`conversation_details_${selectedConversation.sid}`);
      loadConversationDetails(true);
    } catch (err) {
      setError('Failed to send message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = (message) => {
    setEditingItem(message);
    setMessageForm({
      author: message.author || '',
      body: message.body || '',
      attributes: message.attributes ? JSON.stringify(JSON.parse(message.attributes), null, 2) : ''
    });
    setShowMessageModal(true);
  };

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { body: messageForm.body, attributes: messageForm.attributes };
      
      // Validate and parse attributes JSON if provided
      if (data.attributes && data.attributes.trim()) {
        try {
          JSON.parse(data.attributes);
        } catch (err) {
          setError('Invalid JSON in attributes field');
          setLoading(false);
          return;
        }
      }
      
      await apiClient.conversations.updateServiceMessage(
        selectedService.sid,
        selectedConversation.sid,
        editingItem.sid,
        data
      );
      setSuccess('Message updated successfully');
      setShowMessageModal(false);
      setMessageForm({ author: '', body: '', attributes: '' });
      setEditingItem(null);
      invalidateCache(`conversation_details_${selectedConversation.sid}`);
      loadConversationDetails(true);
    } catch (err) {
      setError('Failed to update message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageSid) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.deleteServiceMessage(
        selectedService.sid,
        selectedConversation.sid,
        messageSid
      );
      setSuccess('Message deleted successfully');
      invalidateCache(`conversation_details_${selectedConversation.sid}`);
      loadConversationDetails(true);
    } catch (err) {
      setError('Failed to delete message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (participantSid) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.deleteServiceParticipant(
        selectedService.sid,
        selectedConversation.sid,
        participantSid
      );
      setSuccess('Participant removed successfully');
      invalidateCache(`conversation_details_${selectedConversation.sid}`);
      loadConversationDetails(true);
    } catch (err) {
      setError('Failed to remove participant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToIntelligence = async (e) => {
    e.preventDefault();
    if (!selectedIntelligenceService) {
      setError('Please select an Intelligence Service');
      return;
    }
    
    console.log('[Export] Starting export operation');
    console.log('[Export] Conversation Service SID:', selectedService?.sid);
    console.log('[Export] Conversation SID:', selectedConversation?.sid);
    console.log('[Export] Intelligence Service SID:', selectedIntelligenceService);
    console.log('[Export] Selected Service object:', selectedService);
    console.log('[Export] Selected Conversation object:', selectedConversation);
    
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.conversations.exportToIntelligence(
        selectedService.sid,
        selectedConversation.sid,
        selectedIntelligenceService
      );
      console.log('[Export] Export successful, result:', result);
      setExportResult(result);
      setSuccess('Conversation exported to Intelligence Service successfully!');
      setShowExportModal(false);
      
      // Store the mapping between conversation and transcript
      if (result.transcript_sid || result.transcriptSid) {
        const transcriptSid = result.transcript_sid || result.transcriptSid;
        const intelligenceService = intelligenceServices.find(s => s.sid === selectedIntelligenceService);
        const transcriptMapKey = `transcript_map_${selectedConversation.sid}`;
        localStorage.setItem(transcriptMapKey, JSON.stringify({
          transcriptSid,
          intelligenceServiceName: intelligenceService?.uniqueName || intelligenceService?.friendlyName || 'Unknown',
          exportedAt: Date.now()
        }));
        
        // Invalidate operator results cache for this conversation
        invalidateCache(`operator_results_${selectedConversation.sid}`);
        
        // Wait for processing then load operator results
        setTimeout(() => {
          checkForOperatorResults(true);
        }, 3000);
      }
    } catch (err) {
      setError('Failed to export conversation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleEditService = (service) => {
    setEditingItem(service);
    setServiceForm({ friendlyName: service.friendlyName || '' });
    setShowServiceModal(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.updateService(editingItem.sid, serviceForm);
      setSuccess('Service updated successfully');
      setShowServiceModal(false);
      setServiceForm({ friendlyName: '' });
      setEditingItem(null);
      invalidateCache('services');
      loadServices(true);
    } catch (err) {
      setError('Failed to update service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceSid) => {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.deleteService(serviceSid);
      setSuccess('Service deleted successfully');
      invalidateCache('services');
      loadServices(true);
    } catch (err) {
      setError('Failed to delete service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditConversation = (conversation) => {
    setEditingItem(conversation);
    setConversationForm({ 
      friendlyName: conversation.friendlyName || '', 
      uniqueName: conversation.uniqueName || '',
      attributes: conversation.attributes ? JSON.stringify(JSON.parse(conversation.attributes), null, 2) : ''
    });
    setShowConversationModal(true);
  };

  const handleUpdateConversation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { ...conversationForm };
      
      // Validate and parse attributes JSON if provided
      if (data.attributes && data.attributes.trim()) {
        try {
          JSON.parse(data.attributes);
        } catch (err) {
          setError('Invalid JSON in attributes field');
          setLoading(false);
          return;
        }
      }
      
      await apiClient.conversations.updateServiceConversation(
        selectedService.sid, 
        editingItem.sid, 
        data
      );
      setSuccess('Conversation updated successfully');
      setShowConversationModal(false);
      setConversationForm({ friendlyName: '', uniqueName: '', attributes: '' });
      setEditingItem(null);
      invalidateCache(`conversations_${selectedService.sid}`);
      loadConversations(true);
    } catch (err) {
      setError('Failed to update conversation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationSid) => {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.deleteServiceConversation(selectedService.sid, conversationSid);
      setSuccess('Conversation deleted successfully');
      invalidateCache(`conversations_${selectedService.sid}`);
      loadConversations(true);
    } catch (err) {
      setError('Failed to delete conversation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveConversation = async (conversationSid, currentState) => {
    if (currentState === 'closed') {
      setError('Cannot activate a closed conversation. Closed conversations are permanently closed.');
      return;
    }
    
    const newState = currentState === 'active' ? 'inactive' : 'active';
    setLoading(true);
    setError('');
    try {
      await apiClient.conversations.updateServiceConversation(
        selectedService.sid,
        conversationSid,
        { state: newState }
      );
      setSuccess(`Conversation ${newState === 'inactive' ? 'archived' : 'activated'} successfully`);
      invalidateCache(`conversations_${selectedService.sid}`);
      loadConversations(true);
    } catch (err) {
      setError('Failed to update conversation state: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveAll = async () => {
    const filtered = filterConversations(conversations);
    const sorted = sortConversations(filtered);
    const activeConversations = sorted.filter(c => c.state === 'active');
    
    if (activeConversations.length === 0) {
      setError('No active conversations to archive');
      return;
    }
    
    if (!confirm(`Are you sure you want to archive all ${activeConversations.length} active conversations?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const conversationSids = activeConversations.map(c => c.sid);
      const result = await apiClient.conversations.bulkArchiveConversations(selectedService.sid, conversationSids);
      
      if (result.failed > 0) {
        setSuccess(`Archived ${result.archived} conversations. ${result.failed} failed.`);
      } else {
        setSuccess(`Successfully archived ${result.archived} conversations`);
      }
      
      invalidateCache(`conversations_${selectedService.sid}`);
      loadConversations(true);
    } catch (err) {
      setError('Failed to archive conversations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOperatorResults = async (conversationSid, serviceSid) => {
    setLoadingOperatorResults(true);
    setViewingOperatorResults(null);
    setShowOperatorResultsModal(true);
    
    try {
      // Check if we have a stored transcript SID for this conversation
      const transcriptMapKey = `transcript_map_${conversationSid}`;
      const transcriptMap = localStorage.getItem(transcriptMapKey);
      
      if (!transcriptMap) {
        setError('This conversation has not been exported to Intelligence yet.');
        setShowOperatorResultsModal(false);
        return;
      }
      
      const { transcriptSid, intelligenceServiceName } = JSON.parse(transcriptMap);
      
      // Get operator results for this transcript
      const resultsResponse = await apiClient.intelligence.getOperatorResults(transcriptSid);
      const results = resultsResponse.operatorResults || resultsResponse || [];
      
      if (results.length === 0) {
        setError('No operator results found. The analysis may still be processing.');
        setShowOperatorResultsModal(false);
        return;
      }
      
      setViewingOperatorResults({
        transcriptSid,
        serviceName: intelligenceServiceName,
        conversationServiceSid: serviceSid,
        results
      });
    } catch (err) {
      setError('Failed to load operator results: ' + err.message);
      setShowOperatorResultsModal(false);
    } finally {
      setLoadingOperatorResults(false);
    }
  };

  const { user, organization, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="conversations-app">
      <header className="app-header">
        <div>
          <h1>Conversations App</h1>
          <p>Manage Conversations and export to Conversational Intelligence</p>
        </div>
      </header>

      {/* User info bar */}
      <div style={{
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#6C5CE7',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {(user?.name || user?.email_address || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              {user?.name || user?.email_address}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {organization?.organization_name}
            </div>
          </div>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ padding: '6px 16px', fontSize: '14px' }}
        >
          Logout
        </button>
      </div>

      {/* Breadcrumb navigation */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 40px',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
          <span 
            onClick={() => setCurrentView('services')}
            style={{ 
              cursor: 'pointer', 
              color: currentView === 'services' ? '#0263E0' : '#666',
              fontWeight: currentView === 'services' ? '500' : 'normal',
              textDecoration: currentView === 'services' ? 'none' : 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Services
          </span>
          
          {(currentView === 'conversations' || currentView === 'conversation-detail') && selectedService && (
            <>
              <span style={{ color: '#ccc' }}>/</span>
              <span 
                onClick={() => setCurrentView('conversations')}
                style={{ 
                  cursor: 'pointer',
                  color: currentView === 'conversations' ? '#0263E0' : '#666',
                  fontWeight: currentView === 'conversations' ? '500' : 'normal'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                {selectedService.friendlyName || selectedService.sid}
              </span>
            </>
          )}
          
          {currentView === 'conversation-detail' && selectedConversation && (
            <>
              <span style={{ color: '#ccc' }}>/</span>
              <span style={{ color: '#0263E0', fontWeight: '500' }}>
                {selectedConversation.friendlyName || selectedConversation.sid}
              </span>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {exportResult && (
          <div className="alert alert-success">
            <strong>Export Successful!</strong><br />
            Transcript SID: <code>{exportResult.transcript_sid || exportResult.transcriptSid}</code>
          </div>
        )}

        {currentView === 'services' && (
          <div className="view">
            <div className="view-header">
              <h2>Conversation Services</h2>
              <button className="btn btn-primary" onClick={() => setShowServiceModal(true)}>
                Create Service
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : services.length === 0 ? (
              <div className="empty-state">No services found. Create your first service.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SID</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.sid}>
                      <td><strong>{service.friendlyName || service.sid}</strong></td>
                      <td><code>{service.sid}</code></td>
                      <td>{new Date(service.dateCreated).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="btn btn-sm"
                            onClick={() => {
                              setSelectedService(service);
                              setCurrentView('conversations');
                            }}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditService(service)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm"
                            style={{ backgroundColor: '#f44336', color: 'white' }}
                            onClick={() => handleDeleteService(service.sid)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {currentView === 'conversations' && (
          <div className="view">
            <div className="view-header">
              <div>
                <button 
                  className="btn btn-secondary"
                onClick={() => {
                  setSelectedService(null);
                  setCurrentView('services');
                }}
              >
                  Back to Services
                </button>
                <h2 style={{ display: 'inline-block', marginLeft: '20px' }}>
                  {selectedService.friendlyName || selectedService.sid} - Conversations
                </h2>
              </div>
              <button className="btn btn-primary" onClick={() => setShowConversationModal(true)}>
                Create Conversation
              </button>
            </div>
            
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Search & Filters</h3>
              
              {/* Search input */}
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Search conversations (name, unique name, attributes, participants)..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Filters row */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85em', marginBottom: '5px', display: 'block' }}>State</label>
                  <select 
                    value={conversationStateFilter} 
                    onChange={(e) => setConversationStateFilter(e.target.value)}
                  >
                    <option value="all">All States</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85em', marginBottom: '5px', display: 'block' }}>From Date</label>
                  <input
                    type="date"
                    value={conversationDateFrom}
                    onChange={(e) => setConversationDateFrom(e.target.value)}
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85em', marginBottom: '5px', display: 'block' }}>To Date</label>
                  <input
                    type="date"
                    value={conversationDateTo}
                    onChange={(e) => setConversationDateTo(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Sort controls */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <select value={conversationSortBy} onChange={(e) => setConversationSortBy(e.target.value)}>
                    <option value="dateCreated">Sort by: Date</option>
                    <option value="name">Sort by: Name</option>
                    <option value="state">Sort by: State</option>
                    <option value="participants">Sort by: Participants</option>
                  </select>
                </div>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setConversationSortOrder(conversationSortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {conversationSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
                {(conversationSearch || conversationStateFilter !== 'all' || conversationDateFrom || conversationDateTo) && (
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => {
                      setConversationSearch('');
                      setConversationStateFilter('all');
                      setConversationDateFrom('');
                      setConversationDateTo('');
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">No conversations found. Create your first conversation.</div>
            ) : (() => {
              const filtered = filterConversations(conversations);
              const sorted = sortConversations(filtered);
              
              return filtered.length === 0 ? (
                <div className="empty-state">No conversations match your search.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ color: '#666', margin: 0 }}>
                      Showing {sorted.length} of {conversations.length} conversations
                    </p>
                    {sorted.filter(c => c.state === 'active').length > 0 && (
                      <button 
                        className="btn btn-sm"
                        style={{ backgroundColor: '#FF9800', color: 'white' }}
                        onClick={handleArchiveAll}
                        disabled={loading}
                      >
                        Archive All ({sorted.filter(c => c.state === 'active').length} Active)
                      </button>
                    )}
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>State</th>
                        <th>Participants</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((conversation) => (
                    <tr key={conversation.sid}>
                      <td><strong>{conversation.friendlyName || conversation.sid}</strong></td>
                      <td><span className={`badge badge-${conversation.state}`}>{conversation.state}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ backgroundColor: '#2196F3', color: 'white' }}>
                          {conversation.participantsCount ?? 0}
                        </span>
                      </td>
                      <td>{new Date(conversation.dateCreated).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-sm"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setCurrentView('conversation-detail');
                            }}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditConversation(conversation)}
                          >
                            Edit
                          </button>
                          {localStorage.getItem(`transcript_map_${conversation.sid}`) && (
                            <button 
                              className="btn btn-sm"
                              style={{ backgroundColor: '#9C27B0', color: 'white' }}
                              onClick={() => handleViewOperatorResults(conversation.sid, selectedService.sid)}
                            >
                              View AI Results
                            </button>
                          )}
                          {conversation.state !== 'closed' && (
                            <button 
                              className="btn btn-sm"
                              style={{ backgroundColor: conversation.state === 'active' ? '#FF9800' : '#4CAF50', color: 'white' }}
                              onClick={() => handleArchiveConversation(conversation.sid, conversation.state)}
                            >
                              {conversation.state === 'active' ? 'Archive' : 'Activate'}
                            </button>
                          )}
                          <button 
                            className="btn btn-sm"
                            style={{ backgroundColor: '#f44336', color: 'white' }}
                            onClick={() => handleDeleteConversation(conversation.sid)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              );
            })()}
          </div>
        )}

        {currentView === 'conversation-detail' && (
          <div className="view">
            <div className="view-header">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedConversation(null);
                  setCurrentView('conversations');
                }}
              >
                Back to Conversations
              </button>
              <div>
                <button className="btn btn-primary" onClick={() => setShowExportModal(true)}>
                  Export to Intelligence
                </button>
              </div>
            </div>

            {loadingOperatorResults && (
              <div className="card" style={{ backgroundColor: '#f0f8ff', borderLeft: '4px solid #2196F3' }}>
                <p>Checking for Intelligence analysis...</p>
              </div>
            )}

            {operatorResults && (
              <div className="card" style={{ backgroundColor: '#f0fff4', borderLeft: '4px solid #4CAF50', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Intelligence Analysis Results</h3>
                  <div>
                    <span className="badge" style={{ backgroundColor: '#4CAF50', color: 'white', marginRight: '10px' }}>
                      {operatorResults.serviceName}
                    </span>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => {
                        invalidateCache(`operator_results_${selectedConversation.sid}`);
                        checkForOperatorResults(true);
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                  Transcript: <code>{operatorResults.transcriptSid}</code>
                </p>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {operatorResults.results.map((result, index) => (
                    <div key={index} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '1em' }}>{result.name || 'Operator Result'}</h4>
                      <p style={{ fontSize: '0.85em', color: '#666', margin: '0 0 10px 0' }}>
                        Type: <strong>{result.operatorType}</strong>
                      </p>
                      
                      {result.operatorType === 'text-generation' && (
                        <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.textGenerationResults}</p>
                        </div>
                      )}
                      
                      {result.operatorType === 'conversation-classify' && (
                        <div>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Label:</strong> {result.predictedLabel}
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Confidence:</strong> {(result.predictedProbability * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                      
                      {result.operatorType === 'pii-extraction' && result.extractionResults && (
                        <div>
                          {Object.entries(result.extractionResults).map(([key, value]) => (
                            <p key={key} style={{ margin: '5px 0' }}>
                              <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2>{selectedConversation.friendlyName || selectedConversation.sid}</h2>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <th>SID</th>
                    <td><code>{selectedConversation.sid}</code></td>
                  </tr>
                  <tr>
                    <th>State</th>
                    <td><span className={`badge badge-${selectedConversation.state}`}>{selectedConversation.state}</span></td>
                  </tr>
                  <tr>
                    <th>Created</th>
                    <td>{new Date(selectedConversation.dateCreated).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tabs">
              <div className="tab-header">
                <h3>Messages ({messages.length})</h3>
                <button className="btn btn-primary" onClick={() => setShowMessageModal(true)}>
                  Send Message
                </button>
              </div>
              
              {messages.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Search messages (body, author)..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    style={{ width: '100%', maxWidth: '400px' }}
                  />
                  {messageSearch && (
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setMessageSearch('')}
                      style={{ marginLeft: '10px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="empty-state">No messages yet. Send the first message.</div>
              ) : (() => {
                const filtered = filterMessages(messages);
                return filtered.length === 0 ? (
                  <div className="empty-state">No messages match your search.</div>
                ) : (
                  <>
                    {messageSearch && (
                      <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.9em' }}>
                        Showing {filtered.length} of {messages.length} messages
                      </p>
                    )}
                    <div className="messages-list">
                      {filtered.map((message) => (
                        <div key={message.sid} className="message-item" style={{ position: 'relative' }}>
                          <div className="message-author">{message.author}</div>
                          <div className="message-body">{message.body || '(no body)'}</div>
                          <div className="message-time">{new Date(message.dateCreated).toLocaleString()}</div>
                          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditMessage(message)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm"
                              style={{ backgroundColor: '#f44336', color: 'white' }}
                              onClick={() => handleDeleteMessage(message.sid)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="tabs" style={{ marginTop: '30px' }}>
              <div className="tab-header">
                <h3>Participants ({participants.length})</h3>
                <button className="btn btn-primary" onClick={() => setShowParticipantModal(true)}>
                  Add Participant
                </button>
              </div>
              
              {participants.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Search participants (identity, address)..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    style={{ width: '100%', maxWidth: '400px' }}
                  />
                  {participantSearch && (
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setParticipantSearch('')}
                      style={{ marginLeft: '10px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
              
              {participants.length === 0 ? (
                <div className="empty-state">No participants yet.</div>
              ) : (() => {
                const filtered = filterParticipants(participants);
                return filtered.length === 0 ? (
                  <div className="empty-state">No participants match your search.</div>
                ) : (
                  <>
                    {participantSearch && (
                      <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.9em' }}>
                        Showing {filtered.length} of {participants.length} participants
                      </p>
                    )}
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Identity</th>
                          <th>Binding</th>
                          <th>Date Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((participant) => (
                          <tr key={participant.sid}>
                            <td><strong>{participant.identity}</strong></td>
                            <td>{participant.messagingBinding?.address || '-'}</td>
                            <td>{new Date(participant.dateCreated).toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn btn-sm"
                                style={{ backgroundColor: '#f44336', color: 'white' }}
                                onClick={() => handleDeleteParticipant(participant.sid)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {showServiceModal && (
          <div className="modal-overlay" onClick={() => {
            setShowServiceModal(false);
            setEditingItem(null);
            setServiceForm({ friendlyName: '' });
          }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingItem ? 'Edit Service' : 'Create Service'}</h3>
              <form onSubmit={editingItem ? handleUpdateService : handleCreateService}>
                <div className="form-group">
                  <label>Friendly Name</label>
                  <input
                    type="text"
                    value={serviceForm.friendlyName}
                    onChange={(e) => setServiceForm({ ...serviceForm, friendlyName: e.target.value })}
                    placeholder="My Conversation Service"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowServiceModal(false);
                    setEditingItem(null);
                    setServiceForm({ friendlyName: '' });
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConversationModal && (
          <div className="modal-overlay" onClick={() => {
            setShowConversationModal(false);
            setEditingItem(null);
            setConversationForm({ friendlyName: '', uniqueName: '', attributes: '' });
          }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingItem ? 'Edit Conversation' : 'Create Conversation'}</h3>
              <form onSubmit={editingItem ? handleUpdateConversation : handleCreateConversation}>
                <div className="form-group">
                  <label>Friendly Name</label>
                  <input
                    type="text"
                    value={conversationForm.friendlyName}
                    onChange={(e) => setConversationForm({ ...conversationForm, friendlyName: e.target.value })}
                    placeholder="My Conversation"
                  />
                </div>
                <div className="form-group">
                  <label>Unique Name</label>
                  <input
                    type="text"
                    value={conversationForm.uniqueName}
                    onChange={(e) => setConversationForm({ ...conversationForm, uniqueName: e.target.value })}
                    placeholder="my-conversation"
                  />
                </div>
                <div className="form-group">
                  <label>Attributes (JSON)</label>
                  <textarea
                    value={conversationForm.attributes}
                    onChange={(e) => setConversationForm({ ...conversationForm, attributes: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows="3"
                  />
                  <small style={{ color: '#666' }}>Optional: Custom JSON attributes for this conversation</small>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowConversationModal(false);
                    setEditingItem(null);
                    setConversationForm({ friendlyName: '', uniqueName: '', attributes: '' });
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showMessageModal && (
          <div className="modal-overlay" onClick={() => {
            setShowMessageModal(false);
            setEditingItem(null);
            setMessageForm({ author: '', body: '', attributes: '' });
          }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingItem ? 'Edit Message' : 'Send Message'}</h3>
              <form onSubmit={editingItem ? handleUpdateMessage : handleSendMessage}>
                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    value={messageForm.author}
                    onChange={(e) => setMessageForm({ ...messageForm, author: e.target.value })}
                    placeholder="user@example.com"
                    required
                    disabled={editingItem}
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={messageForm.body}
                    onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })}
                    placeholder="Type your message here..."
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Attributes (JSON)</label>
                  <textarea
                    value={messageForm.attributes}
                    onChange={(e) => setMessageForm({ ...messageForm, attributes: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows="3"
                  />
                  <small style={{ color: '#666' }}>Optional: Custom JSON attributes for this message</small>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowMessageModal(false);
                    setEditingItem(null);
                    setMessageForm({ author: '', body: '', attributes: '' });
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {editingItem ? 'Update' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showParticipantModal && (
          <div className="modal-overlay" onClick={() => setShowParticipantModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Participant</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  await apiClient.conversations.addServiceParticipant(selectedService.sid, selectedConversation.sid, participantForm);
                  setSuccess('Participant added successfully');
                  setShowParticipantModal(false);
                  setParticipantForm({ identity: '', attributes: '' });
                  invalidateCache(`conversation_details_${selectedConversation.sid}`);
                  loadConversationDetails(true);
                } catch (err) {
                  setError('Failed to add participant: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label>Identity *</label>
                  <input
                    type="text"
                    value={participantForm.identity}
                    onChange={(e) => setParticipantForm({ ...participantForm, identity: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Attributes (JSON)</label>
                  <textarea
                    value={participantForm.attributes}
                    onChange={(e) => setParticipantForm({ ...participantForm, attributes: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows="3"
                  />
                  <small style={{ color: '#666' }}>Optional: Custom JSON attributes for this participant</small>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowParticipantModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Export to Conversational Intelligence</h3>
              <div className="info-box">
                <strong>Export Conversations (not Voice)</strong>
                <p>This exports chat, WhatsApp, and Conversations API messages to an Intelligence Service for analysis. It does NOT export Voice conversations.</p>
              </div>
              <form onSubmit={handleExportToIntelligence}>
                <div className="form-group">
                  <label>Intelligence Service *</label>
                  <select
                    value={selectedIntelligenceService}
                    onChange={(e) => setSelectedIntelligenceService(e.target.value)}
                    required
                  >
                    <option value="">Select a service...</option>
                    {intelligenceServices.map((service) => (
                      <option key={service.sid} value={service.sid}>
                        {service.uniqueName || service.unique_name || service.friendlyName || service.friendly_name || service.sid}
                        {service.languageCode && ` - ${service.languageCode}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Export
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showOperatorResultsModal && (
          <div className="modal-overlay" onClick={() => setShowOperatorResultsModal(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <h3>Intelligence Analysis Results</h3>
              
              {loadingOperatorResults ? (
                <div className="loading">Loading operator results...</div>
              ) : viewingOperatorResults ? (
                <>
                  <div className="info-box" style={{ marginBottom: '20px' }}>
                    <p><strong>Intelligence Service:</strong> {viewingOperatorResults.serviceName}</p>
                    <p><strong>Transcript SID:</strong> <code>{viewingOperatorResults.transcriptSid}</code></p>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
                    {viewingOperatorResults.results.map((result, index) => (
                      <div key={index} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1em' }}>{result.name || 'Operator Result'}</h4>
                        <p style={{ fontSize: '0.85em', color: '#666', margin: '0 0 10px 0' }}>
                          Type: <strong>{result.operatorType}</strong>
                        </p>
                        
                        {result.operatorType === 'text-generation' && (
                          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.textGenerationResults}</p>
                          </div>
                        )}
                        
                        {result.operatorType === 'conversation-classify' && (
                          <div>
                            <p style={{ margin: '5px 0' }}>
                              <strong>Label:</strong> {result.predictedLabel}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                              <strong>Confidence:</strong> {(result.predictedProbability * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                        
                        {result.operatorType === 'pii-extraction' && result.extractionResults && (
                          <div>
                            {Object.entries(result.extractionResults).map(([key, value]) => (
                              <p key={key} style={{ margin: '5px 0' }}>
                                <strong>{key}:</strong> {JSON.stringify(value)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => setShowOperatorResultsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

export default ConversationsApp;
