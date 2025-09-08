import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Spotify credentials not configured' }, { status: 500 });
  }

  try {
    const redirect_uri = `${request.nextUrl.origin}/api/spotify/callback`;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    // Return HTML page with the tokens
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Spotify Integration Success</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success { color: #1DB954; margin-bottom: 20px; }
        .code-block { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; border-left: 4px solid #1DB954; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="success">🎉 Spotify Integration Success!</h1>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> Copy your refresh token below and save it securely. You won't see this again!
        </div>
        
        <h3>Add this to your .env.local file:</h3>
        <div class="code-block">
SPOTIFY_CLIENT_ID=${process.env.SPOTIFY_CLIENT_ID}<br>
SPOTIFY_CLIENT_SECRET=${process.env.SPOTIFY_CLIENT_SECRET}<br>
SPOTIFY_REFRESH_TOKEN=${data.refresh_token}
        </div>
        
        <h3>Your Refresh Token:</h3>
        <div class="code-block">${data.refresh_token}</div>
        
        <p><strong>Next steps:</strong></p>
        <ol>
            <li>Create a <code>.env.local</code> file in your project root if it doesn't exist</li>
            <li>Add the environment variables shown above</li>
            <li>Restart your development server: <code>npm run dev</code></li>
            <li>Your Spotify tracks should now appear on your homepage!</li>
        </ol>
        
        <button onclick="window.close()" style="background: #1DB954; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
            Close this window
        </button>
    </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
    
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
}
