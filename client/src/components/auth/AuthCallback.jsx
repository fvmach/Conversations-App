import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const token = searchParams.get('token');
        const tokenType = searchParams.get('stytch_token_type');

        if (!token || !tokenType) {
          setError('Missing authentication parameters');
          setProcessing(false);
          return;
        }

        console.log('Processing authentication callback...');
        
        await handleAuthCallback(token, tokenType);
        
        console.log('Authentication successful, redirecting...');
        
        // Redirect to main app after successful authentication
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err.message || 'Authentication failed');
        setProcessing(false);
      }
    };

    authenticate();
  }, [searchParams, handleAuthCallback, navigate]);

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
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        {processing ? (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #0263E0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }} />
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <h2 style={{ marginBottom: '8px' }}>Authenticating...</h2>
            <p style={{ color: '#666' }}>
              Please wait while we verify your login.
            </p>
          </>
        ) : error ? (
          <>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: '#dc3545'
            }}>
              ✕
            </div>
            <h2 style={{ marginBottom: '8px', color: '#dc3545' }}>
              Authentication Failed
            </h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0263E0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AuthCallback;
