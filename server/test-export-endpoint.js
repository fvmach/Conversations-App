const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testExportEndpoint() {
  console.log('Testing Conversations Export Endpoint\n');
  
  try {
    console.log('1. Checking server health...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✓ Server is running\n');
    
    console.log('2. Checking credentials...');
    const credStatus = await axios.get(`${API_BASE}/api/credentials/status`);
    if (!credStatus.data.hasCredentials) {
      console.log('✗ No credentials configured. Please set up credentials first.');
      return;
    }
    console.log(`✓ Credentials configured (${credStatus.data.authMethod})\n`);
    
    console.log('3. Listing Conversation Services...');
    const services = await axios.get(`${API_BASE}/api/twilio/conversations/services`);
    if (!services.data || services.data.length === 0) {
      console.log('✗ No services found. Create a service first.');
      return;
    }
    const serviceSid = services.data[0].sid;
    console.log(`✓ Found ${services.data.length} service(s)`);
    console.log(`  Using service: ${serviceSid}\n`);
    
    console.log('4. Listing Conversations in Service...');
    const conversations = await axios.get(`${API_BASE}/api/twilio/conversations/services/${serviceSid}/conversations`);
    if (!conversations.data || conversations.data.length === 0) {
      console.log('✗ No conversations found. Create a conversation with messages first.');
      return;
    }
    const conversationSid = conversations.data[0].sid;
    console.log(`✓ Found ${conversations.data.length} conversation(s)`);
    console.log(`  Using conversation: ${conversationSid}\n`);
    
    console.log('5. Listing Intelligence Services...');
    const intelligenceServices = await axios.get(`${API_BASE}/api/twilio/intelligence/services`);
    const intelServices = intelligenceServices.data.services || intelligenceServices.data || [];
    if (!intelServices || intelServices.length === 0) {
      console.log('✗ No Intelligence Services found. Create one in Twilio Console first.');
      return;
    }
    const intelligenceServiceSid = intelServices[0].sid;
    console.log(`✓ Found ${intelServices.length} Intelligence Service(s)`);
    console.log(`  Using Intelligence Service: ${intelligenceServiceSid}\n`);
    
    console.log('6. Testing Export Endpoint...');
    console.log(`   POST ${API_BASE}/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/export`);
    console.log(`   Body: { intelligenceServiceSid: "${intelligenceServiceSid}" }\n`);
    
    const exportResult = await axios.post(
      `${API_BASE}/api/twilio/conversations/services/${serviceSid}/conversations/${conversationSid}/export`,
      { intelligenceServiceSid: intelligenceServiceSid }
    );
    
    console.log('✓ Export successful!');
    console.log('  Response:', JSON.stringify(exportResult.data, null, 2));
    
    if (exportResult.data.transcript_sid || exportResult.data.transcriptSid) {
      const transcriptSid = exportResult.data.transcript_sid || exportResult.data.transcriptSid;
      console.log(`\n✓ Transcript created: ${transcriptSid}`);
      console.log('  The conversation messages have been exported to Intelligence Service.');
      console.log('  This is using the Conversations API Export endpoint (not Voice).');
    }
    
    console.log('\n✓ All tests passed!');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\nTip: Make sure credentials are configured via POST /api/credentials');
    }
  }
}

testExportEndpoint();
