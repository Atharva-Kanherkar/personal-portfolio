"use client";

import React, { useState, useEffect } from 'react';
import { Column, Row, Text, Heading, Card, Button } from "@once-ui-system/core";
import { FaSpotify, FaMusic, FaClock, FaCalendarAlt, FaChartLine, FaUsers, FaHeadphones, FaArrowLeft } from 'react-icons/fa';
import styles from './SpotifyAnalytics.module.scss';

interface Artist {
  id: string;
  name: string;
  image: string;
  popularity: number;
  genres: string[];
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
  audio_features: AudioFeatures;
}

interface ListeningStats {
  totalTracks: number;
  totalArtists: number;
  averagePopularity: number;
  totalListeningTime: number;
  topGenres: string[];
  audioFeatures: AudioFeatures;
}

interface TimeRangeData {
  label: string;
  value: 'short_term' | 'medium_term' | 'long_term';
}

const timeRanges: TimeRangeData[] = [
  { label: '4 Weeks', value: 'short_term' },
  { label: '6 Months', value: 'medium_term' },
  { label: 'All Time', value: 'long_term' },
];

export default function SpotifyAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [topTracks, setTopTracks] = useState<TrackWithFeatures[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch top tracks with audio features
      const tracksResponse = await fetch(`/api/spotify/analytics/tracks?time_range=${selectedTimeRange}`);
      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        setTopTracks(tracksData.tracks || []);
      }

      // Fetch top artists
      const artistsResponse = await fetch(`/api/spotify/analytics/artists?time_range=${selectedTimeRange}`);
      if (artistsResponse.ok) {
        const artistsData = await artistsResponse.json();
        setTopArtists(artistsData.artists || []);
      }

      // Fetch listening statistics
      const statsResponse = await fetch(`/api/spotify/analytics/stats?time_range=${selectedTimeRange}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || null);
      }

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatListeningTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const getFeatureColor = (value: number) => {
    if (value > 0.7) return '#1DB954';
    if (value > 0.4) return '#FFA500';
    return '#FF6B6B';
  };

  const getFeatureLabel = (feature: string) => {
    const labels: Record<string, string> = {
      danceability: 'Danceability',
      energy: 'Energy',
      valence: 'Positivity',
      acousticness: 'Acoustic',
      instrumentalness: 'Instrumental',
    };
    return labels[feature] || feature;
  };

  return (
    <Column maxWidth="xl" paddingY="24" gap="32" horizontal="center">
      {/* Header */}
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="16" vertical="center">
          <Button
            href="/"
            variant="tertiary"
            size="s"
          >
            <Row gap="8" vertical="center">
              <FaArrowLeft />
              Back to Home
            </Row>
          </Button>
          <FaSpotify size={48} color="#1DB954" />
        </Row>
        <Heading variant="heading-strong-xl" align="center">
          Music Analytics Dashboard
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak" align="center">
          Deep insights into your listening patterns and musical preferences
        </Text>
      </Column>

      {/* Time Range Selector */}
      <Row gap="8" horizontal="center" className={styles.timeRangeSelector}>
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            variant={selectedTimeRange === range.value ? "primary" : "tertiary"}
            size="m"
            onClick={() => setSelectedTimeRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </Row>

      {loading ? (
        <Row fillWidth horizontal="center" paddingY="40">
          <Text variant="body-default-l">Loading your music analytics...</Text>
        </Row>
      ) : error ? (
        <Row fillWidth horizontal="center" paddingY="40">
          <Column gap="16" horizontal="center">
            <Text variant="body-default-l" onBackground="danger-weak">
              {error}
            </Text>
            <Button
              href="/spotify-setup"
              variant="primary"
            >
              Setup Spotify Integration
            </Button>
          </Column>
        </Row>
      ) : (
        <>
          {/* Overview Stats */}
          {stats && (
            <Row fillWidth gap="16" wrap>
              <Card flex={1} padding="24" radius="l" background="surface" minWidth="200">
                <Column gap="8" horizontal="center">
                  <FaMusic color="#1DB954" size={24} />
                  <Text variant="heading-strong-xl">{stats.totalTracks}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Tracks</Text>
                </Column>
              </Card>
              <Card flex={1} padding="24" radius="l" background="surface" minWidth="200">
                <Column gap="8" horizontal="center">
                  <FaUsers color="#1DB954" size={24} />
                  <Text variant="heading-strong-xl">{stats.totalArtists}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Artists</Text>
                </Column>
              </Card>
              <Card flex={1} padding="24" radius="l" background="surface" minWidth="200">
                <Column gap="8" horizontal="center">
                  <FaHeadphones color="#1DB954" size={24} />
                  <Text variant="heading-strong-xl">{formatListeningTime(stats.totalListeningTime)}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Listening Time</Text>
                </Column>
              </Card>
              <Card flex={1} padding="24" radius="l" background="surface" minWidth="200">
                <Column gap="8" horizontal="center">
                  <FaChartLine color="#1DB954" size={24} />
                  <Text variant="heading-strong-xl">{Math.round(stats.averagePopularity)}</Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">Avg Popularity</Text>
                </Column>
              </Card>
            </Row>
          )}

          {/* Audio Features Analysis */}
          {stats?.audioFeatures && (
            <Card fillWidth padding="32" radius="l" background="surface">
              <Column gap="24">
                <Heading variant="heading-strong-l" align="center">
                  Your Music DNA
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-weak" align="center">
                  Average audio characteristics of your favorite tracks
                </Text>
                <Row fillWidth gap="24" wrap>
                  {Object.entries(stats.audioFeatures).slice(0, 5).map(([feature, value]) => (
                    <Column key={feature} flex={1} gap="12" minWidth="120">
                      <Text variant="label-default-m" align="center">
                        {getFeatureLabel(feature)}
                      </Text>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${value * 100}%`,
                            backgroundColor: getFeatureColor(value)
                          }}
                        />
                      </div>
                      <Text 
                        variant="body-default-s" 
                        align="center"
                        style={{ color: getFeatureColor(value) }}
                      >
                        {Math.round(value * 100)}%
                      </Text>
                    </Column>
                  ))}
                </Row>
              </Column>
            </Card>
          )}

          {/* Top Tracks */}
          <Card fillWidth padding="32" radius="l" background="surface">
            <Column gap="24">
              <Heading variant="heading-strong-l" align="center">
                Top Tracks
              </Heading>
              <Column gap="16">
                {topTracks.slice(0, 10).map((track, index) => (
                  <Row 
                    key={track.id} 
                    fillWidth 
                    gap="16" 
                    vertical="center" 
                    padding="16"
                    radius="m"
                    className={styles.trackRow}
                  >
                    <Text variant="heading-strong-m" style={{ minWidth: '24px' }}>
                      {index + 1}
                    </Text>
                    <img
                      src={track.image}
                      alt={`${track.album} cover`}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <Column flex={1} gap="4">
                      <Text variant="heading-strong-m">{track.name}</Text>
                      <Text variant="body-default-m" onBackground="neutral-weak">
                        {track.artist}
                      </Text>
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        {track.album} • {formatDuration(track.duration_ms)}
                      </Text>
                    </Column>
                    <Column gap="4" horizontal="end" minWidth="100">
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        Popularity
                      </Text>
                      <Text variant="heading-strong-s" style={{ color: '#1DB954' }}>
                        {track.popularity}%
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Column>
            </Column>
          </Card>

          {/* Top Artists */}
          <Card fillWidth padding="32" radius="l" background="surface">
            <Column gap="24">
              <Heading variant="heading-strong-l" align="center">
                Top Artists
              </Heading>
              <Row fillWidth gap="16" wrap>
                {topArtists.slice(0, 8).map((artist, index) => (
                  <Card
                    key={artist.id}
                    flex={1}
                    minWidth="200"
                    padding="20"
                    radius="l"
                    background="neutral-alpha-weak"
                    className={styles.artistCard}
                  >
                    <Column gap="12" horizontal="center">
                      <Text variant="heading-strong-s">#{index + 1}</Text>
                      <img
                        src={artist.image}
                        alt={`${artist.name} profile`}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <Text variant="heading-strong-m" align="center">
                        {artist.name}
                      </Text>
                      <Text variant="body-default-s" onBackground="neutral-weak" align="center">
                        {artist.genres?.slice(0, 2).join(', ') || 'Various genres'}
                      </Text>
                      <Text variant="body-default-s" style={{ color: '#1DB954' }}>
                        {artist.popularity}% popularity
                      </Text>
                    </Column>
                  </Card>
                ))}
              </Row>
            </Column>
          </Card>

          {/* Genres */}
          {stats?.topGenres && stats.topGenres.length > 0 && (
            <Card fillWidth padding="32" radius="l" background="surface">
              <Column gap="24">
                <Heading variant="heading-strong-l" align="center">
                  Your Music Genres
                </Heading>
                <Row fillWidth gap="12" wrap horizontal="center">
                  {stats.topGenres.slice(0, 15).map((genre, index) => (
                    <Card
                      key={genre}
                      padding="12"
                      radius="full"
                      background="brand-alpha-weak"
                    >
                      <Text variant="body-default-s" style={{ color: '#1DB954' }}>
                        #{index + 1} {genre}
                      </Text>
                    </Card>
                  ))}
                </Row>
              </Column>
            </Card>
          )}
        </>
      )}

      {/* Footer */}
      <Row fillWidth horizontal="center" paddingY="16">
        <Text variant="label-default-s" onBackground="neutral-weak" align="center">
          Data powered by Spotify Web API • Advanced analytics showcase backend skills
        </Text>
      </Row>
    </Column>
  );
}
