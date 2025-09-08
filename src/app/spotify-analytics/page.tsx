"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Column, Row, Text, Heading, Card, Button } from "@once-ui-system/core";
import { FaSpotify, FaMusic, FaClock, FaCalendarAlt, FaUsers, FaHeadphones, FaArrowLeft, FaPlay, FaPause, FaExternalLinkAlt, FaFire, FaList, FaUser } from 'react-icons/fa';
import styles from './SpotifyAnalytics.module.scss';

interface Artist {
  id: string;
  name: string;
  image: string;
  popularity: number;
  genres: string[];
  followers: number;
}

interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
}

interface TrackWithFeatures {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  popularity: number;
  duration_ms: number;
  preview_url?: string | null;
  external_url: string;
  audio_features: AudioFeatures;
}

interface ListeningStats {
  total_tracks: number;
  total_artists: number;
  total_listening_time_ms: number;
  unique_genres: number;
  top_genres: Array<{ genre: string; count: number }>;
  average_track_popularity: number;
  average_artist_popularity: number;
  music_dna: AudioFeatures;
  time_range_label: string;
}

interface TimeRangeData {
  label: string;
  value: 'short_term' | 'medium_term' | 'long_term';
}

type TabType = 'tracks' | 'artists' | 'stats' | 'genres';

const timeRanges: TimeRangeData[] = [
  { label: '4 Weeks', value: 'short_term' },
  { label: '6 Months', value: 'medium_term' },
  { label: 'All Time', value: 'long_term' },
];

export default function SpotifyAnalytics() {
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [tracks, setTracks] = useState<TrackWithFeatures[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tracksRes, artistsRes, statsRes] = await Promise.all([
        fetch(`/api/spotify/analytics/tracks?time_range=${selectedTimeRange}`),
        fetch(`/api/spotify/analytics/artists?time_range=${selectedTimeRange}`),
        fetch(`/api/spotify/analytics/stats?time_range=${selectedTimeRange}`)
      ]);

      // Handle individual endpoint failures
      let tracksData = { tracks: [] };
      let artistsData = { artists: [] };
      let statsData = { stats: null };

      if (tracksRes.ok) {
        tracksData = await tracksRes.json();
      } else {
        console.warn('Failed to fetch tracks data:', tracksRes.status);
      }

      if (artistsRes.ok) {
        artistsData = await artistsRes.json();
      } else {
        console.warn('Failed to fetch artists data:', artistsRes.status);
      }

      if (statsRes.ok) {
        statsData = await statsRes.json();
      } else {
        console.warn('Failed to fetch stats data:', statsRes.status);
      }

      // Check if all endpoints failed
      if (!tracksRes.ok && !artistsRes.ok && !statsRes.ok) {
        throw new Error('All Spotify API endpoints failed. Please check your authentication.');
      }

      setTracks(tracksData.tracks || []);
      setArtists(artistsData.artists || []);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (track: TrackWithFeatures) => {
    if (!track.preview_url) {
      // If no preview, open in Spotify
      window.open(track.external_url, '_blank');
      return;
    }

    if (currentPlaying === track.id) {
      // Stop current track
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentPlaying(null);
    } else {
      // Stop any currently playing track
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Play new track
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(err => {
        console.error('Error playing preview:', err);
        // Fallback to Spotify if preview fails
        window.open(track.external_url, '_blank');
      });
      
      audioRef.current.onended = () => {
        setCurrentPlaying(null);
      };
      
      setCurrentPlaying(track.id);
    }
  };

  const openInSpotify = (url: string) => {
    console.log('Opening Spotify URL:', url);
    if (url?.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.error('Invalid Spotify URL:', url);
      // Fallback: search for the track on Spotify web
      window.open('https://open.spotify.com/', '_blank', 'noopener,noreferrer');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatListeningTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const formatPopularity = (popularity: number) => {
    return `${popularity}%`;
  };

  const getAudioFeatureDescription = (feature: string, value: number) => {
    const descriptions: Record<string, string[]> = {
      danceability: ['Low danceability', 'Moderate danceability', 'High danceability'],
      energy: ['Low energy', 'Moderate energy', 'High energy'],
      valence: ['Sad/negative', 'Neutral mood', 'Happy/positive'],
      acousticness: ['Electronic', 'Mixed', 'Acoustic'],
      instrumentalness: ['Vocal-heavy', 'Some vocals', 'Instrumental'],
    };
    
    const index = value < 0.33 ? 0 : value < 0.67 ? 1 : 2;
    return descriptions[feature]?.[index] || 'Unknown';
  };

  if (loading) {
    return (
      <Column fillWidth gap="xl" paddingY="24" horizontal="center">
        <Text variant="heading-strong-xl">Loading my music analytics...</Text>
      </Column>
    );
  }

  if (error) {
    return (
      <Column fillWidth gap="xl" paddingY="24" horizontal="center">
        <Text variant="heading-strong-xl">Unable to load Spotify analytics</Text>
        <Text variant="body-default-l" onBackground="neutral-weak">{error}</Text>
        <Text variant="body-default-m" onBackground="neutral-weak">
          This might be due to an expired Spotify refresh token. Please check your environment variables.
        </Text>
        <Button onClick={() => { window.location.href = '/'; }} size="m">
          <FaArrowLeft /> Back to Home
        </Button>
      </Column>
    );
  }

  // Check if we have any data to display
  const hasData = tracks.length > 0 || artists.length > 0 || stats;
  
  if (!loading && !hasData) {
    return (
      <Column fillWidth gap="xl" paddingY="24" horizontal="center">
        <Text variant="heading-strong-xl">No Spotify data available</Text>
        <Text variant="body-default-l" onBackground="neutral-weak">
          Unable to load my Spotify listening data. This might be due to:
        </Text>
        <Column gap="8" paddingX="24">
          <Text variant="body-default-m" onBackground="neutral-weak">• Expired Spotify refresh token</Text>
          <Text variant="body-default-m" onBackground="neutral-weak">• No listening history for the selected time range</Text>
          <Text variant="body-default-m" onBackground="neutral-weak">• Spotify API authentication issues</Text>
        </Column>
        <Button onClick={() => { window.location.href = '/'; }} size="m">
          <FaArrowLeft /> Back to Home
        </Button>
      </Column>
    );
  }

  return (
    <Column 
      fillWidth 
      maxWidth="m" 
      gap="xl" 
      paddingY="24" 
      paddingX="24"
      horizontal="center"
    >
      {/* Header */}
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="12" vertical="center" horizontal="center">
          <Button onClick={() => { window.location.href = '/'; }} variant="tertiary" size="s">
            <FaArrowLeft />
          </Button>
          <FaSpotify size={32} color="#1DB954" />
          <Heading variant="heading-strong-xl">My Spotify Analytics</Heading>
        </Row>
        <Text variant="body-default-l" onBackground="neutral-weak">
          Deep dive into my music listening patterns and preferences
        </Text>
      </Column>

      {/* Time Range Selector */}
      <Row fillWidth horizontal="center" gap="8" className={styles.timeRangeSelector}>
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            onClick={() => setSelectedTimeRange(range.value)}
            variant={selectedTimeRange === range.value ? "primary" : "secondary"}
            size="m"
          >
            {range.label}
          </Button>
        ))}
      </Row>

      {/* Beautiful Tabs Navigation - EXACT COPY FROM HOME PAGE */}
      <Row fillWidth gap="8" horizontal="center" className={styles.tabsContainer}>
        {[
          { id: 'tracks', label: 'Top Tracks', icon: FaFire },
          { id: 'artists', label: 'Top Artists', icon: FaUser },
          { id: 'stats', label: 'Listening Stats', icon: FaCalendarAlt },
          { id: 'genres', label: 'Music DNA', icon: FaMusic },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "tertiary"}
            size="s"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
          >
            <Row gap="8" vertical="center">
              <tab.icon size={14} />
              <Text variant="label-default-s">{tab.label}</Text>
            </Row>
          </Button>
        ))}
      </Row>

      {/* Dynamic Content Based on Active Tab - EXACT STYLING FROM HOME PAGE */}
      <Column fillWidth gap="16">
        {/* Tracks Tab */}
        {activeTab === 'tracks' && 
          tracks.slice(0, 10).map((track, index) => (
            <Card
              key={track.id}
              fillWidth
              padding="20"
              radius="l"
              border="neutral-alpha-weak"
              background="surface"
              className={styles.trackCard}
            >
              <Row fillWidth gap="16" vertical="center">
                <Text variant="body-strong-s" style={{ minWidth: '24px' }}>
                  #{index + 1}
                </Text>
                <div className={styles.albumCover}>
                  <img 
                    src={track.image} 
                    alt={track.album}
                    className={styles.albumImage}
                  />
                  <Button
                    onClick={() => playPreview(track)}
                    variant="primary"
                    size="s"
                    className={styles.playButton}
                  >
                    {currentPlaying === track.id ? <FaPause size={10} /> : <FaPlay size={10} />}
                  </Button>
                </div>
                <Column flex={1} gap="4">
                  <Text variant="body-strong-m" className={styles.trackName}>
                    {track.name}
                  </Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    {track.artist} • {track.album}
                  </Text>
                </Column>
                <Row gap="8" vertical="center">
                  <Column gap="4" horizontal="end">
                    <Text variant="body-default-s">{formatDuration(track.duration_ms)}</Text>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      {formatPopularity(track.popularity)} popularity
                    </Text>
                  </Column>
                  <Button
                    onClick={() => openInSpotify(track.external_url)}
                    variant="tertiary"
                    size="s"
                    style={{ minWidth: '32px' }}
                  >
                    <FaExternalLinkAlt size={12} />
                  </Button>
                </Row>
              </Row>
            </Card>
          ))
        }

        {/* Artists Tab */}
        {activeTab === 'artists' && 
          <Row fillWidth gap="16" wrap>
            {artists.slice(0, 12).map((artist) => (
              <Card
                key={artist.id}
                padding="20"
                radius="l"
                border="neutral-alpha-weak"
                background="surface"
                className={styles.artistCard}
                minWidth={180}
              >
                <Column gap="12" horizontal="center">
                  {artist.image && (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <Column gap="4" horizontal="center">
                    <Text variant="body-strong-m" style={{ textAlign: 'center' }}>
                      {artist.name}
                    </Text>
                    <Text variant="body-default-s" onBackground="neutral-weak">
                      {formatPopularity(artist.popularity)} popularity
                    </Text>
                    {artist.followers && (
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {artist.followers.toLocaleString()} followers
                      </Text>
                    )}
                  </Column>
                  {artist.genres.length > 0 && (
                    <Row gap="4" wrap horizontal="center">
                      {artist.genres.slice(0, 2).map((genre) => (
                        <Text 
                          key={genre}
                          variant="body-default-xs" 
                          onBackground="neutral-weak"
                          style={{ 
                            padding: '4px 8px',
                            backgroundColor: 'rgba(29, 185, 84, 0.1)',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}
                        >
                          {genre}
                        </Text>
                      ))}
                    </Row>
                  )}
                </Column>
              </Card>
            ))}
          </Row>
        }

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <Column fillWidth gap="20">
            {/* Stats Overview */}
            <Row fillWidth gap="16" wrap>
              <Card flex={1} padding="20" radius="l" background="surface" minWidth={180} border="neutral-alpha-weak">
                <Column gap="8" horizontal="center">
                  <FaMusic color="#1DB954" size={24} />
                  <Text variant="heading-strong-l">{stats.total_tracks}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Top Tracks</Text>
                </Column>
              </Card>
              <Card flex={1} padding="20" radius="l" background="surface" minWidth={180} border="neutral-alpha-weak">
                <Column gap="8" horizontal="center">
                  <FaUsers color="#1DB954" size={24} />
                  <Text variant="heading-strong-l">{stats.total_artists}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Artists</Text>
                </Column>
              </Card>
              <Card flex={1} padding="20" radius="l" background="surface" minWidth={180} border="neutral-alpha-weak">
                <Column gap="8" horizontal="center">
                  <FaClock color="#1DB954" size={24} />
                  <Text variant="heading-strong-l">{formatListeningTime(stats.total_listening_time_ms)}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Total Time</Text>
                </Column>
              </Card>
              <Card flex={1} padding="20" radius="l" background="surface" minWidth={180} border="neutral-alpha-weak">
                <Column gap="8" horizontal="center">
                  <FaHeadphones color="#1DB954" size={24} />
                  <Text variant="heading-strong-l">{stats.unique_genres}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Genres</Text>
                </Column>
              </Card>
            </Row>

            {/* Top Genres */}
            {stats.top_genres.length > 0 && (
              <Card padding="20" radius="l" background="surface" border="neutral-alpha-weak">
                <Column gap="16">
                  <Heading variant="heading-strong-m">Top Genres</Heading>
                  <Row fillWidth gap="12" wrap>
                    {stats.top_genres.slice(0, 8).map((genre, index) => (
                      <Card key={genre.genre} padding="12" radius="m" background="neutral-alpha-weak">
                        <Row gap="8" vertical="center">
                          <Text variant="body-strong-s">{genre.genre}</Text>
                          <Text variant="body-default-xs" onBackground="neutral-weak">
                            ({genre.count})
                          </Text>
                        </Row>
                      </Card>
                    ))}
                  </Row>
                </Column>
              </Card>
            )}
          </Column>
        )}

        {/* Music DNA Tab */}
        {activeTab === 'genres' && stats && (
          <Card padding="24" radius="l" background="surface" border="neutral-alpha-weak">
            <Column gap="20">
              <Column gap="8" horizontal="center">
                <Heading variant="heading-strong-l">My Music DNA</Heading>
                <Text variant="body-default-m" onBackground="neutral-weak">
                  Based on audio features of my top tracks from {stats.time_range_label}
                </Text>
              </Column>
              <Row fillWidth gap="24" wrap>
                {Object.entries(stats.music_dna).map(([feature, value]) => (
                  <Column key={feature} gap="12" flex={1} minWidth={200}>
                    <Row horizontal="between" vertical="center">
                      <Text variant="body-strong-m" style={{ textTransform: 'capitalize' }}>
                        {feature}
                      </Text>
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        {Math.round(value * 100)}%
                      </Text>
                    </Row>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${value * 100}%`,
                          backgroundColor: '#1DB954'
                        }}
                      />
                    </div>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      {getAudioFeatureDescription(feature, value)}
                    </Text>
                  </Column>
                ))}
              </Row>
            </Column>
          </Card>
        )}
      </Column>
    </Column>
  );
}
