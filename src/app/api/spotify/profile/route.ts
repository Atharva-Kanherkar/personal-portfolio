// First, let's create an API route to get your Spotify profile
// This will ensure we have the correct user ID for follow buttons

// filepath: /home/atharva/personal-portfolio/src/app/api/spotify/profile/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SPOTIFY_REFRESH_TOKEN) {
      return NextResponse.json({ error: 'Spotify refresh token not configured' }, { status: 500 });
    }

    spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);

    // Get current user profile
    const profile = await spotifyApi.getMe();

    return NextResponse.json({
      id: profile.body.id,
      display_name: profile.body.display_name,
      external_urls: profile.body.external_urls,
      followers: profile.body.followers,
      images: profile.body.images
    });
  } catch (error) {
    console.error('Error fetching Spotify profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}