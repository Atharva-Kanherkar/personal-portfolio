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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') as 'short_term' | 'medium_term' | 'long_term' || 'medium_term';

    spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);

    // Get top artists for the specified time range
    const topArtists = await spotifyApi.getMyTopArtists({ 
      limit: 20, 
      time_range: timeRange 
    });

    // Transform artist data
    const artists = topArtists.body.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      external_url: artist.external_urls.spotify,
    }));

    return NextResponse.json({ artists });
  } catch (error) {
    console.error('Error fetching artist analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch artist analytics' }, { status: 500 });
  }
}
