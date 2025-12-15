import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StytchLogin = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login, adminBypass } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await login(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Welcome to Conversations App
        </h1>
        <p style={{
          color: '#666',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Sign in with your email to continue
        </p>

        {success ? (
          <div style={{
            padding: '16px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <strong>Magic link sent!</strong>
            <p style={{ marginTop: '8px', marginBottom: 0 }}>
              Check your email and click the link to sign in.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: loading ? '#ccc' : '#0263E0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#0052CC';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#0263E0';
                }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            <p style={{
              marginTop: '24px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              We'll send you a secure link to sign in without a password.
            </p>

            <div style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await adminBypass();
                    navigate('/');
                  } catch (err) {
                    setError('Admin bypass failed');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🔧 Admin Bypass (Testing Only)
              </button>
              <p style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#999',
                textAlign: 'center'
              }}>
                Temporary bypass for testing. Remove in production.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StytchLogin;
