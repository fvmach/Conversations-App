# Admin Bypass - Quick Testing Guide

## What is This?

A temporary admin bypass button has been added to the login page to allow you to test the Conversations App while you debug the Stytch integration.

**⚠️ WARNING: This is for testing only and MUST be removed before production!**

## How to Use It

1. **Start the servers**:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

2. **Access the app**:
   - Open `http://localhost:5173`
   - You'll see the login page with two options:
     - Magic Link (Stytch) - For when Stytch is configured
     - **🔧 Admin Bypass (Testing Only)** - Red button at the bottom

3. **Click the Admin Bypass button**:
   - Instantly logs you in as "Admin (Bypass)"
   - Creates a fake session without requiring Stytch
   - Redirects you to the main app

4. **Use the app normally**:
   - You can now test all features
   - Create services, conversations, messages
   - Export to Intelligence
   - Everything works as if you were authenticated

## What Gets Created

When you click Admin Bypass, you get a fake session with:
- **Email**: admin@test.local
- **Name**: Admin (Bypass)
- **Organization**: Admin Organization (Bypass)

This appears in the top right of the app header.

## Limitations

- Session persists until you logout or restart the server
- No actual Stytch authentication is happening
- Organization is fake (not in Stytch)
- **Not secure** - anyone can access with one click

## When to Use This

Use the admin bypass while:
- Debugging Stytch configuration
- Testing app features without Stytch setup
- Developing new features
- You don't have Stytch credentials yet

## When NOT to Use This

Do NOT use admin bypass:
- In production environments
- When testing authentication flows
- After Stytch is fully configured
- In any public or shared deployment

## Testing Stytch vs. Bypass

You can switch between them:

**To test Stytch:**
1. Make sure Stytch is configured (see STYTCH_SETUP.md)
2. Use the magic link login form
3. Check your email for the link

**To bypass Stytch:**
1. Click the red "Admin Bypass" button
2. You're instantly logged in

## Removing the Bypass

When you're ready to remove the admin bypass:
1. See **[REMOVE_ADMIN_BYPASS.md](REMOVE_ADMIN_BYPASS.md)** for detailed instructions
2. The file lists all code that needs to be removed
3. Includes a verification checklist

Quick removal locations:
- `server/index.js` - Admin bypass route and session check
- `server/middleware/stytchAuth.js` - Middleware bypass
- `client/src/contexts/AuthContext.jsx` - adminBypass function
- `client/src/components/auth/StytchLogin.jsx` - Red button

## Files Modified

The admin bypass touches these files:

**Backend:**
- `server/index.js` - Added `/auth/admin-bypass` route and session handling
- `server/middleware/stytchAuth.js` - Allow bypass token

**Frontend:**
- `client/src/contexts/AuthContext.jsx` - Added `adminBypass()` function
- `client/src/components/auth/StytchLogin.jsx` - Added red bypass button

All changes are marked with comments:
```javascript
// TEMPORARY: ... (REMOVE IN PRODUCTION)
```

## Security Note

**This completely bypasses authentication!**

The admin bypass:
- ✅ Good for local development and testing
- ❌ Bad for any production environment
- ❌ Bad for shared/public deployments
- ❌ Bad for testing actual auth flows

Make sure to remove it before deploying to production.

## Quick Start (Testing Now)

If you just want to test the app right now:

```bash
# Start backend
cd server
npm start

# In another terminal, start frontend
cd client
npm run dev

# Open browser to http://localhost:5173
# Click "🔧 Admin Bypass (Testing Only)"
# Start using the app!
```

## Troubleshooting

### Admin Bypass button doesn't work
- Check that both servers are running
- Check browser console for errors
- Make sure you're on `http://localhost:5173`

### "Admin bypass failed" error
- Restart the backend server
- Check server logs for errors
- Verify `server/index.js` has the bypass route

### Can't see the button
- Make sure you're on the login page (`/login`)
- Check that `StytchLogin.jsx` has the bypass code
- Clear browser cache and reload

## Next Steps

1. **Now**: Use admin bypass to test the app
2. **Soon**: Configure Stytch properly (see STYTCH_SETUP.md)
3. **Before Production**: Remove admin bypass (see REMOVE_ADMIN_BYPASS.md)

Enjoy testing without authentication! 🎉
