# Google OAuth 2.0 Setup Guide

This guide will help you set up Google OAuth 2.0 authentication for your Eragon application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

## Step 2: Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application** as the application type
4. Configure the OAuth consent screen:
   - Add your application name: "Eragon - AI Sales Intelligence"
   - Add authorized domains if deploying to production
   - Add scopes: `email`, `profile`, `openid`

## Step 3: Configure Authorized Origins

Add the following to your **Authorized JavaScript origins**:
- `http://localhost:5173` (for development)
- `https://yourdomain.com` (for production)

Add the following to your **Authorized redirect URIs**:
- `http://localhost:5173/auth` (for development)
- `https://yourdomain.com/auth` (for production)

## Step 4: Get Your Client ID

1. Copy your **Client ID** from the credentials page
2. It should look like: `123456789-abcdef123456.apps.googleusercontent.com`

## Step 5: Update Your Application

1. Open `frontend/src/config/auth.js`
2. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:

```javascript
export const AUTH_CONFIG = {
  GOOGLE_CLIENT_ID: "123456789-abcdef123456.apps.googleusercontent.com", // Your actual Client ID
};
```

## Step 6: Test the Integration

1. Start your development server: `pnpm dev`
2. Navigate to `http://localhost:5173/auth`
3. Click the "Continue with Google" button
4. You should see the Google OAuth consent screen

## Security Notes

- **Never commit your Client ID to version control** if it contains sensitive information
- For production, consider using environment variables
- The Client ID is public and safe to include in client-side code
- The Client Secret (if used) should never be exposed in client-side code

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: Make sure your redirect URIs match exactly in the Google Console
2. **"origin_mismatch"**: Ensure your JavaScript origins are correctly configured
3. **"invalid_client"**: Check that your Client ID is correct and the project is enabled

### Debug Mode:

Add this to your browser console to see detailed OAuth information:
```javascript
localStorage.setItem('google_oauth_debug', 'true');
```

## Production Deployment

For production deployment:

1. Add your production domain to authorized origins
2. Update the redirect URIs for your production domain
3. Consider using environment variables for the Client ID
4. Test the OAuth flow on your production domain

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google Documentation](https://github.com/MomenSherif/react-oauth)
- [Google Cloud Console](https://console.cloud.google.com/) 