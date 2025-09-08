import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  
  if (!client_id) {
    return NextResponse.json({ error: 'Spotify client ID not configured' }, { status: 500 });
  }

  const scope = 'user-top-read user-read-recently-played user-read-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';
  const redirect_uri = `${request.nextUrl.origin}/api/spotify/callback`;
  
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;

  return NextResponse.redirect(authUrl);
}
