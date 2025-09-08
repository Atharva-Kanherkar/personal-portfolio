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
    
    // Try to refresh the access token
    try {
      const data = await spotifyApi.refreshAccessToken();
      spotifyApi.setAccessToken(data.body.access_token);
    } catch (authError) {
      console.error('Spotify authentication error:', authError);
      return NextResponse.json({ 
        error: 'Spotify authentication failed. Please update your refresh token.',
        details: authError instanceof Error ? authError.message : 'Authentication error'
      }, { status: 401 });
    }

    // Get top tracks and artists for calculations
    const [topTracks, topArtists] = await Promise.all([
      spotifyApi.getMyTopTracks({ limit: 50, time_range: timeRange }),
      spotifyApi.getMyTopArtists({ limit: 50, time_range: timeRange })
    ]);

    // Check if we have data
    if (!topTracks.body.items || topTracks.body.items.length === 0) {
      return NextResponse.json({ 
        stats: {
          total_tracks: 0,
          total_artists: 0,
          total_listening_time_ms: 0,
          unique_genres: 0,
          top_genres: [],
          average_track_popularity: 0,
          average_artist_popularity: 0,
          music_dna: {
            danceability: 0,
            energy: 0,
            valence: 0,
            acousticness: 0,
            instrumentalness: 0,
            speechiness: 0,
          },
          time_range_label: timeRange === 'short_term' ? 'Last 4 weeks' : 
                           timeRange === 'medium_term' ? 'Last 6 months' : 
                           'All time',
        }
      });
    }

    // Calculate total listening time (estimate based on track durations)
    const totalListeningTime = topTracks.body.items.reduce((total, track) => {
      return total + track.duration_ms;
    }, 0);

    // Get unique genres from top artists
    const genresSet = new Set<string>();
    for (const artist of topArtists.body.items) {
      for (const genre of artist.genres) {
        genresSet.add(genre);
      }
    }
    const uniqueGenres = Array.from(genresSet);

    // Calculate average popularity
    const averageTrackPopularity = topTracks.body.items.reduce((sum, track) => sum + track.popularity, 0) / topTracks.body.items.length;
    const averageArtistPopularity = topArtists.body.items.reduce((sum, artist) => sum + artist.popularity, 0) / topArtists.body.items.length;

    // Get top genres by count
    const genreCounts: { [key: string]: number } = {};
    for (const artist of topArtists.body.items) {
      for (const genre of artist.genres) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Get audio features for top tracks to calculate music DNA
    const trackIds = topTracks.body.items.slice(0, 20).map(track => track.id);
    const audioFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);

    // Calculate average audio features (Music DNA)
    const validFeatures = audioFeatures.body.audio_features.filter(features => features !== null);
    const averageFeatures = {
      danceability: validFeatures.reduce((sum, features) => sum + features.danceability, 0) / validFeatures.length,
      energy: validFeatures.reduce((sum, features) => sum + features.energy, 0) / validFeatures.length,
      valence: validFeatures.reduce((sum, features) => sum + features.valence, 0) / validFeatures.length,
      acousticness: validFeatures.reduce((sum, features) => sum + features.acousticness, 0) / validFeatures.length,
      instrumentalness: validFeatures.reduce((sum, features) => sum + features.instrumentalness, 0) / validFeatures.length,
      speechiness: validFeatures.reduce((sum, features) => sum + features.speechiness, 0) / validFeatures.length,
    };

    const stats = {
      total_tracks: topTracks.body.items.length,
      total_artists: topArtists.body.items.length,
      total_listening_time_ms: totalListeningTime,
      unique_genres: uniqueGenres.length,
      top_genres: topGenres,
      average_track_popularity: Math.round(averageTrackPopularity),
      average_artist_popularity: Math.round(averageArtistPopularity),
      music_dna: averageFeatures,
      time_range_label: timeRange === 'short_term' ? 'Last 4 weeks' : 
                       timeRange === 'medium_term' ? 'Last 6 months' : 
                       'All time',
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching listening stats:', error);
    return NextResponse.json({ error: 'Failed to fetch listening stats' }, { status: 500 });
  }
}
