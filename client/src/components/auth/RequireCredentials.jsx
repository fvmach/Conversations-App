import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const RequireCredentials = ({ children }) => {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    const status = await apiClient.getCredentialsStatus();
    setHasCredentials(status.hasCredentials);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.saveCredentials(accountSid, authToken);
      setHasCredentials(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (!hasCredentials) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Enter Twilio Credentials</h2>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Account SID:</label>
            <input
              type="text"
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Auth Token:</label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#0263E0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : 'Save Credentials'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>
            <strong>Development Mode:</strong> Skip authentication temporarily
          </p>
          <button
            onClick={() => setHasCredentials(true)}
            style={{ width: '100%', padding: '10px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Skip Auth (Dev Only)
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireCredentials;
