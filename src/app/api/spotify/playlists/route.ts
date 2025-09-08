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

    // Get user's playlists
    const playlists = await spotifyApi.getUserPlaylists({ limit: 6 });

    // Format the response
    const formattedPlaylists = playlists.body.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      image: playlist.images[0]?.url,
      external_url: playlist.external_urls.spotify,
      tracks_total: playlist.tracks.total,
      public: playlist.public,
      owner: playlist.owner.display_name,
    }));

    return NextResponse.json({ playlists: formattedPlaylists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}
