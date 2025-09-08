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

    // Get currently playing track
    const currentlyPlaying = await spotifyApi.getMyCurrentPlaybackState();
    
    let currentTrack = null;
    if (currentlyPlaying.body?.is_playing && currentlyPlaying.body?.item) {
      const item = currentlyPlaying.body.item;
      
      // Check if it's a track (not a podcast episode)
      if (item.type === 'track') {
        const track = item as SpotifyApi.TrackObjectFull;
        currentTrack = {
          id: track.id,
          name: track.name,
          artist: track.artists.map((artist) => artist.name).join(', '),
          album: track.album.name,
          image: track.album.images[0]?.url,
          external_url: track.external_urls.spotify,
          duration_ms: track.duration_ms,
          progress_ms: currentlyPlaying.body.progress_ms,
          is_playing: currentlyPlaying.body.is_playing,
        };
      }
    }

    return NextResponse.json({ currentTrack });
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    return NextResponse.json({ currentTrack: null });
  }
}
