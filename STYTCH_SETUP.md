# Stytch B2B Authentication Setup Guide

This guide will help you configure Stytch authentication for the Conversations App.

## Your Stytch Project Details

- **Project ID**: `project-test-f74fbba9-feee-4dd1-8247-63f91310e46d`
- **Project Domain**: `https://local-pillow-6188.customers.stytch.dev`
- **Project Slug**: `my-first-project-sanh`
- **Environment Slug**: `test-jzyf`
- **Workspace ID**: `workspace-prod-9dc42530-9c88-4632-bea6-33034d0eb8cd`

## Step 1: Get Your Stytch Secret

1. Go to [Stytch Dashboard](https://stytch.com/dashboard)
2. Navigate to **API Keys** section
3. Copy your **Secret** for the test environment
4. Add it to `server/.env`:
   ```bash
   STYTCH_SECRET=secret-test-your-actual-secret-here
   ```

## Step 2: Configure Stytch Dashboard Settings

### Enable Frontend SDKs
1. In your Stytch Dashboard, go to **SDK Configuration**
2. Under **Test Environment**, enable **Frontend SDKs**

### Add Authorized Domains
1. Go to **Authorized Applications** in the Dashboard
2. Add the following domain:
   - `http://localhost:5173`

### Enable Organization Creation
1. Go to **Products** > **Organizations**
2. Enable the **Create organizations** toggle
3. This allows users to create new organizations during signup

### Configure Redirect URLs
1. Go to **Redirect URLs** in the Dashboard
2. Add the following URL:
   - `http://localhost:5173/auth/callback`
3. This is where users will be redirected after clicking the magic link

## Step 3: Test the Integration

1. **Start the backend server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the frontend client**:
   ```bash
   cd client
   npm run dev
   ```

3. **Test the login flow**:
   - Open `http://localhost:5173`
   - Enter your email address
   - Click "Send Magic Link"
   - Check your email
   - Click the magic link
   - You should be redirected back to the app, authenticated!

## Authentication Flow

### Discovery Flow
The app uses Stytch's **Discovery flow**, which means:

1. **First-time users**: Automatically create a new organization
2. **Existing users**: Join their existing organization(s)
3. **Organization naming**: Based on email domain (e.g., `user@company.com` → "user's Organization")

### Session Management
- Sessions last 24 hours by default
- Automatic session refresh on API calls
- HTTP-only cookies for security
- Server-side session validation

## Troubleshooting

### "No credentials configured" error
- Make sure `STYTCH_SECRET` is set in `server/.env`
- Restart the server after updating `.env`

### Magic link not working
- Check that redirect URL matches: `http://localhost:5173/auth/callback`
- Verify Frontend SDKs are enabled in Test environment
- Check browser console for errors

### "Authentication failed" error
- Verify your Stytch credentials in `server/.env`
- Check server logs for detailed error messages
- Ensure you're using the test environment credentials

### CORS errors
- Make sure `CLIENT_URL` is set correctly in `server/.env`
- Default is `http://localhost:5173`

## Production Deployment

When deploying to production:

1. **Update environment variables**:
   ```bash
   # Use production Stytch credentials
   STYTCH_PROJECT_ID=project-live-xxxxx
   STYTCH_SECRET=secret-live-xxxxx
   
   # Generate a strong session secret
   SESSION_SECRET=<generate-random-secret-32-chars>
   
   # Update URLs to production domains
   DISCOVERY_REDIRECT_URL=https://yourdomain.com/auth/callback
   CLIENT_URL=https://yourdomain.com
   ```

2. **Update Stytch Dashboard**:
   - Add production domain to Authorized Applications
   - Add production callback URL to Redirect URLs
   - Switch to Live environment credentials

3. **Enable HTTPS**:
   - The session cookies will automatically use `secure: true` in production
   - Ensure `NODE_ENV=production` is set

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong session secrets** - Generate random 32+ character strings
3. **Enable HTTPS in production** - Required for secure cookies
4. **Set up rate limiting** - Protect auth endpoints from abuse
5. **Monitor authentication logs** - Track failed login attempts

## Additional Resources

- [Stytch B2B Documentation](https://stytch.com/docs/b2b)
- [Stytch Node.js Quickstart](https://stytch.com/docs/b2b/quickstarts/node)
- [Stytch Dashboard](https://stytch.com/dashboard)
- [Stytch Support](https://stytch.com/contact)
