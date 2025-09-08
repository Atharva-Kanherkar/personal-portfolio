# Spotify Integration Setup Guide

This guide will help you set up Spotify integration for your portfolio to display your favorite tracks.

## Prerequisites

1. A Spotify account (free or premium)
2. A Spotify Developer App

## Step 1: Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the details:
   - **App Name**: "Portfolio Music Widget" (or any name you prefer)
   - **App Description**: "Widget to display favorite tracks on portfolio website"
   - **Website**: Your portfolio URL
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/spotify` (for development)
5. Check the box agreeing to Spotify's terms
6. Click "Create"

## Step 2: Get Your Credentials

1. In your newly created app, you'll see:
   - **Client ID** - copy this
   - **Client Secret** - click "Show Client Secret" and copy this

## Step 3: Get Your Refresh Token

This is the trickiest part. You need to authorize your app and get a refresh token.

### Method 1: Using the Spotify Web API Console (Recommended)

1. Go to [Spotify Web API Console](https://developer.spotify.com/console/get-current-user-top-artists-and-tracks/)
2. Click "Get Token"
3. Select these scopes:
   - `user-top-read`
   - `user-read-recently-played`
4. Click "Request Token"
5. Copy the access token
6. Use this access token to get a refresh token (you'll need to exchange it using OAuth flow)

### Method 2: Manual OAuth Flow

1. Create the authorization URL:
```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000&scope=user-top-read user-read-recently-played
```

2. Replace `YOUR_CLIENT_ID` with your actual client ID
3. Visit this URL in your browser
4. Authorize the app
5. You'll be redirected to localhost with a `code` parameter
6. Exchange this code for a refresh token using a POST request to `https://accounts.spotify.com/api/token`

### Method 3: Use the Helper Script (Easiest)

I'll create a helper script for you to get the refresh token easily.

## Step 4: Set Environment Variables

Create a `.env.local` file in your project root with:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Visit your homepage
3. You should see your Spotify tracks at the bottom!

## Troubleshooting

### "Spotify refresh token not configured" error
- Make sure your `.env.local` file exists and has the correct variables
- Restart your development server after adding environment variables

### "Failed to fetch Spotify data" error
- Check that your client ID and secret are correct
- Verify your refresh token is still valid
- Check the browser console for more detailed error messages

### Tracks not showing
- Make sure you have listening history on Spotify
- The widget shows your top tracks from the last 6 months
- If you're a new Spotify user, you might not have enough data yet

## Customization Options

You can customize the widget by modifying `src/components/SpotifyWidget.tsx`:

- **Number of tracks**: Change the `limit` parameter in the API call
- **Time range**: Change `time_range` to:
  - `short_term` (last 4 weeks)
  - `medium_term` (last 6 months) - default
  - `long_term` (all time)
- **Styling**: Modify `SpotifyWidget.module.scss`

## Security Notes

- Never commit your `.env.local` file to version control
- Your refresh token should be kept secret
- Consider using environment variables in production deployment
