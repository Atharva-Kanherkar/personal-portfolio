import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    // Check if refresh token is available
    if (!process.env.SPOTIFY_REFRESH_TOKEN) {
      return NextResponse.json({ error: 'Spotify refresh token not configured' }, { status: 500 });
    }

    // Set refresh token
    spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);

    // Get access token using refresh token
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);

    // Get top tracks
    const topTracks = await spotifyApi.getMyTopTracks({ 
      limit: 6, 
      time_range: 'medium_term' // Options: short_term, medium_term, long_term
    });

    // Format the response
    const tracks = topTracks.body.items.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
      duration_ms: track.duration_ms,
      popularity: track.popularity
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 });
  }
}
