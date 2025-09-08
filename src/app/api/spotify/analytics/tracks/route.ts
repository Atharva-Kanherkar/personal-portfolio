import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SPOTIFY_REFRESH_TOKEN) {
      return NextResponse.json({ error: 'Spotify refresh token not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') as 'short_term' | 'medium_term' | 'long_term' || 'medium_term';

    spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
    
    // Try to refresh the access token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let accessTokenData: any;
    try {
      accessTokenData = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(accessTokenData.body.access_token);
    } catch (authError) {
      console.error('Spotify authentication error:', authError);
      return NextResponse.json({ 
        error: 'Spotify authentication failed. Please update your refresh token.',
        details: authError instanceof Error ? authError.message : 'Authentication error'
      }, { status: 401 });
    }

    // Get top tracks for the specified time range
    const topTracks = await spotifyApi.getMyTopTracks({ 
      limit: 50, 
      time_range: timeRange 
    });

    // Check if we have tracks
    if (!topTracks.body.items || topTracks.body.items.length === 0) {
      return NextResponse.json({ 
        tracks: [],
        message: 'No tracks found for this time range'
      });
    }

    // Get audio features for all tracks
    const trackIds = topTracks.body.items.map(track => track.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let audioFeatures: any;
    
    try {
      audioFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);
    } catch (featuresError) {
      console.error('Error fetching audio features:', featuresError);
      // Return tracks without audio features if this fails
      const tracksWithoutFeatures = topTracks.body.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(', '),
        album: track.album.name,
        image: track.album.images[0]?.url,
        popularity: track.popularity,
        duration_ms: track.duration_ms,
        audio_features: {
          danceability: 0,
          energy: 0,
          valence: 0,
          acousticness: 0,
          instrumentalness: 0,
          tempo: 0,
        }
      }));
      return NextResponse.json({ tracks: tracksWithoutFeatures });
    }

    // Combine track data with audio features
    const tracksWithFeatures = topTracks.body.items.map((track, index) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      popularity: track.popularity,
      duration_ms: track.duration_ms,
      audio_features: audioFeatures.body.audio_features[index] ? {
        danceability: audioFeatures.body.audio_features[index]?.danceability || 0,
        energy: audioFeatures.body.audio_features[index]?.energy || 0,
        valence: audioFeatures.body.audio_features[index]?.valence || 0,
        acousticness: audioFeatures.body.audio_features[index]?.acousticness || 0,
        instrumentalness: audioFeatures.body.audio_features[index]?.instrumentalness || 0,
        tempo: audioFeatures.body.audio_features[index]?.tempo || 0,
      } : {
        danceability: 0,
        energy: 0,
        valence: 0,
        acousticness: 0,
        instrumentalness: 0,
        tempo: 0,
      }
    }));

    return NextResponse.json({ tracks: tracksWithFeatures });
  } catch (error) {
    console.error('Error fetching track analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch track analytics' }, { status: 500 });
  }
}
