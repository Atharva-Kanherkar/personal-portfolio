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

    const recentTracks = await spotifyApi.getMyRecentlyPlayedTracks({ 
      limit: 10 
    });

    const tracks = recentTracks.body.items.map((item) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map((artist) => artist.name).join(', '),
      album: item.track.album.name,
      image: item.track.album.images[0]?.url,
      preview_url: item.track.preview_url,
      external_url: item.track.external_urls.spotify,
      duration_ms: item.track.duration_ms,
      played_at: item.played_at
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch recent tracks' }, { status: 500 });
  }
}
