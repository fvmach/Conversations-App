/**
 * Stytch Authentication Middleware
 * Validates Stytch session tokens and protects routes
 */

const stytchAuth = (stytchClient) => {
  return async (req, res, next) => {
    const sessionToken = req.session.stytchSessionToken;
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Not authenticated. Please log in.',
        code: 'NO_SESSION'
      });
    }
    
    // TEMPORARY: Allow admin bypass token (REMOVE IN PRODUCTION)
    if (sessionToken === 'admin-bypass-token') {
      req.stytchMember = req.session.member;
      req.stytchOrganization = req.session.organization;
      return next();
    }
    
    try {
      // Authenticate the session with Stytch
      const response = await stytchClient.sessions.authenticate({
        session_token: sessionToken
      });
      
      if (response.status_code !== 200) {
        console.error('Invalid Stytch session');
        req.session.stytchSessionToken = undefined;
        req.session.member = undefined;
        req.session.organization = undefined;
        
        return res.status(401).json({ 
          error: 'Session expired or invalid',
          code: 'INVALID_SESSION'
        });
      }
      
      // Update session with fresh token and member info
      req.session.stytchSessionToken = response.session_token;
      req.session.member = response.member;
      req.session.organization = response.organization;
      
      // Attach member and organization to request for downstream use
      req.stytchMember = response.member;
      req.stytchOrganization = response.organization;
      
      next();
    } catch (error) {
      console.error('Stytch session authentication error:', error);
      req.session.stytchSessionToken = undefined;
      
      return res.status(401).json({ 
        error: 'Authentication failed: ' + error.message,
        code: 'AUTH_ERROR'
      });
    }
  };
};

module.exports = stytchAuth;
