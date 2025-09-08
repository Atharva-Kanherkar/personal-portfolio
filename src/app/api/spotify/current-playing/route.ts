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

    const currentPlayback = await spotifyApi.getMyCurrentPlayingTrack();
    
    if (!currentPlayback.body.item || currentPlayback.body.item.type !== 'track') {
      return NextResponse.json({ track: null });
    }

    const track = currentPlayback.body.item;
    
    return NextResponse.json({
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(', '),
        album: track.album.name,
        image: track.album.images[0]?.url,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
        duration_ms: track.duration_ms,
        progress_ms: currentPlayback.body.progress_ms,
        is_playing: currentPlayback.body.is_playing
      }
    });
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    return NextResponse.json({ track: null });
  }
}
