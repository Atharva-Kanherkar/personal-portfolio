#!/usr/bin/env node

/**
 * Spotify Refresh Token Generator
 * 
 * This script helps you get a Spotify refresh token for your portfolio.
 * Run: node scripts/spotify-auth.js
 */

const express = require('express');
const querystring = require('querystring');
const axios = require('axios');

// You'll need to fill these in from your Spotify App
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:8888/callback';

const app = express();
const PORT = 8888;

// Step 1: Start the authorization flow
app.get('/login', (req, res) => {
  const scope = 'user-top-read user-read-recently-played user-read-playback-state';
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
    }));
});

// Step 2: Handle the callback and exchange code for tokens
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  
  if (!code) {
    res.send('Error: No authorization code received');
    return;
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }), {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token } = response.data;

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🎉 Success! Your Spotify tokens:</h1>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Add these to your .env.local file:</h3>
            <pre style="background: #333; color: #fff; padding: 15px; border-radius: 4px;">
SPOTIFY_CLIENT_ID=${CLIENT_ID}
SPOTIFY_CLIENT_SECRET=${CLIENT_SECRET}
SPOTIFY_REFRESH_TOKEN=${refresh_token}
            </pre>
          </div>
          <p><strong>Refresh Token:</strong> <code>${refresh_token}</code></p>
          <p><strong>Access Token:</strong> <code>${access_token}</code></p>
          <p style="color: #666;">The refresh token is what you need for your portfolio. Save it securely!</p>
          <p><a href="javascript:window.close()">Close this window</a></p>
        </body>
      </html>
    `);
    
    console.log('\n🎉 SUCCESS! Your refresh token:');
    console.log(refresh_token);
    console.log('\nAdd this to your .env.local file:');
    console.log(`SPOTIFY_REFRESH_TOKEN=${refresh_token}`);
    
  } catch (error) {
    console.error('Error getting tokens:', error.response?.data || error.message);
    res.send('Error exchanging code for tokens. Check the console for details.');
  }
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h1>🎵 Spotify Portfolio Integration</h1>
        <p>Click the button below to authorize your Spotify account:</p>
        <a href="/login" style="
          display: inline-block;
          background: #1DB954;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
        ">Connect Spotify</a>
        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3>Before you start:</h3>
          <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
            <li>Make sure you've created a Spotify App in the <a href="https://developer.spotify.com/dashboard" target="_blank">Developer Dashboard</a></li>
            <li>Set your app's redirect URI to: <code>http://localhost:8888/callback</code></li>
            <li>Update the CLIENT_ID and CLIENT_SECRET in this script or set them as environment variables</li>
          </ol>
        </div>
      </body>
    </html>
  `);
});

// Instructions
console.log('🎵 Spotify Portfolio Integration Setup');
console.log('=====================================');
console.log('');
console.log('Before running this script:');
console.log('1. Create a Spotify App at https://developer.spotify.com/dashboard');
console.log('2. Add this redirect URI to your app: http://localhost:8888/callback');
console.log('3. Set your CLIENT_ID and CLIENT_SECRET in this script or as environment variables');
console.log('');
console.log(`Starting server on http://localhost:${PORT}`);
console.log('Open your browser and go to http://localhost:8888 to start the authorization flow');

app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
});
