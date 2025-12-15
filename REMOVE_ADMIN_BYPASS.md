# Removing Admin Bypass (When Ready for Production)

The admin bypass was added as a temporary testing feature while debugging Stytch integration. **This MUST be removed before production deployment.**

## What is the Admin Bypass?

A red "Admin Bypass" button on the login page that creates a fake admin session without requiring Stytch authentication. This allows you to test the app while working on the Stytch configuration.

## Files That Need to be Modified

### 1. Backend - Remove Admin Bypass Route

**File:** `server/index.js`

**Remove these lines (around line 301-323):**
```javascript
// TEMPORARY: Admin bypass for testing (REMOVE IN PRODUCTION)
app.post('/auth/admin-bypass', (req, res) => {
  console.log('[Admin Bypass] Creating temporary admin session');
  
  // Create a fake admin session
  req.session.stytchSessionToken = 'admin-bypass-token';
  req.session.member = {
    member_id: 'admin-bypass',
    email_address: 'admin@test.local',
    name: 'Admin (Bypass)'
  };
  req.session.organization = {
    organization_id: 'admin-org',
    organization_name: 'Admin Organization (Bypass)'
  };
  
  res.json({
    success: true,
    member: req.session.member,
    organization: req.session.organization,
    message: 'Admin bypass activated - for testing only'
  });
});
```

### 2. Backend - Remove Admin Bypass from Session Check

**File:** `server/index.js`

**Remove these lines (around line 231-238):**
```javascript
// TEMPORARY: Handle admin bypass (REMOVE IN PRODUCTION)
if (sessionToken === 'admin-bypass-token') {
  return res.json({
    authenticated: true,
    member: req.session.member,
    organization: req.session.organization
  });
}
```

### 3. Backend - Remove Admin Bypass from Middleware

**File:** `server/middleware/stytchAuth.js`

**Remove these lines (around line 17-22):**
```javascript
// TEMPORARY: Allow admin bypass token (REMOVE IN PRODUCTION)
if (sessionToken === 'admin-bypass-token') {
  req.stytchMember = req.session.member;
  req.stytchOrganization = req.session.organization;
  return next();
}
```

### 4. Frontend - Remove Admin Bypass Function

**File:** `client/src/contexts/AuthContext.jsx`

**Remove these lines (around line 114-136):**
```javascript
const adminBypass = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin-bypass`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Admin bypass failed');
    }
    
    setUser(data.member);
    setOrganization(data.organization);
    setAuthenticated(true);
    
    return data;
  } catch (error) {
    console.error('Admin bypass error:', error);
    throw error;
  }
};
```

**And remove from the value object (around line 147):**
```javascript
// Remove this line:
adminBypass
```

### 5. Frontend - Remove Admin Bypass Button

**File:** `client/src/components/auth/StytchLogin.jsx`

**Remove the import (line 2):**
```javascript
// Remove: import { useNavigate } from 'react-router-dom';
// (Keep it only if you use it elsewhere)
```

**Remove from useAuth destructuring (line 10):**
```javascript
// Change from:
const { login, adminBypass } = useAuth();

// To:
const { login } = useAuth();
```

**Remove navigate (line 11):**
```javascript
// Remove this line if not used elsewhere:
const navigate = useNavigate();
```

**Remove the entire admin bypass section (around line 151-188):**
```javascript
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
```

## Quick Command to Find All Admin Bypass Code

Search for "admin-bypass" or "Admin Bypass" in your codebase:

```bash
# From project root
grep -r "admin-bypass" server/ client/
grep -r "Admin Bypass" server/ client/
```

## After Removal

1. Restart both servers
2. Test that the app properly requires Stytch authentication
3. Verify the login page only shows the magic link form
4. Confirm you cannot access protected routes without authentication

## Verification Checklist

- [ ] Removed admin bypass route from `server/index.js`
- [ ] Removed admin bypass check from session route in `server/index.js`
- [ ] Removed admin bypass check from `server/middleware/stytchAuth.js`
- [ ] Removed `adminBypass` function from `client/src/contexts/AuthContext.jsx`
- [ ] Removed `adminBypass` from AuthContext value export
- [ ] Removed admin bypass button from `client/src/components/auth/StytchLogin.jsx`
- [ ] Tested that authentication properly requires Stytch
- [ ] Confirmed no "admin-bypass" strings remain in codebase
