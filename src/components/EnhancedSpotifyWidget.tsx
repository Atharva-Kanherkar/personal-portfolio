"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Column, Row, Text, Heading, Card, Button, Flex } from "@once-ui-system/core";
import { FaSpotify, FaPlay, FaPause, FaExternalLinkAlt, FaClock, FaMusic, FaList, FaUser } from 'react-icons/fa';
import styles from './EnhancedSpotifyWidget.module.scss';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  preview_url?: string | null;
  external_url: string;
  duration_ms: number;
  popularity?: number;
  played_at?: string;
  progress_ms?: number;
  is_playing?: boolean;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
  external_url: string;
  tracks_total: number;
  public: boolean;
  owner: string;
}

interface EnhancedSpotifyWidgetProps {
  className?: string;
}

export const EnhancedSpotifyWidget: React.FC<EnhancedSpotifyWidgetProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'top' | 'current' | 'recent' | 'playlists'>('current');
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchAllData();
    // Set up interval to update currently playing track
    const interval = setInterval(fetchCurrentlyPlaying, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTopTracks(),
      fetchCurrentlyPlaying(),
      fetchRecentlyPlayed(),
      fetchPlaylists(),
    ]);
    setLoading(false);
  };

  const fetchTopTracks = async () => {
    try {
      const response = await fetch('/api/spotify/top-tracks');
      const data = await response.json();
      if (!data.error) {
        setTopTracks(data.tracks);
      }
    } catch (error) {
      console.error('Error fetching top tracks:', error);
    }
  };

  const fetchCurrentlyPlaying = async () => {
    try {
      const response = await fetch('/api/spotify/currently-playing');
      const data = await response.json();
      setCurrentTrack(data.currentTrack);
    } catch (error) {
      console.error('Error fetching currently playing:', error);
    }
  };

  const fetchRecentlyPlayed = async () => {
    try {
      const response = await fetch('/api/spotify/recently-played');
      const data = await response.json();
      if (!data.error) {
        setRecentTracks(data.tracks);
      }
    } catch (error) {
      console.error('Error fetching recently played:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/spotify/playlists');
      const data = await response.json();
      if (!data.error) {
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const playPreview = (track: Track) => {
    if (!track.preview_url) return;

    if (currentPlaying === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      setCurrentPlaying(track.id);
      
      audioRef.current.onended = () => {
        setCurrentPlaying(null);
      };
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderCurrentlyPlaying = () => {
    if (!currentTrack) {
      return (
        <Column fillWidth gap="16" horizontal="center" paddingY="40">
          <Text variant="body-default-m" onBackground="neutral-weak">
            No track currently playing
          </Text>
        </Column>
      );
    }

    const progressPercent = currentTrack.progress_ms && currentTrack.duration_ms 
      ? (currentTrack.progress_ms / currentTrack.duration_ms) * 100 
      : 0;

    return (
      <Card fillWidth padding="24" radius="l" border="neutral-alpha-weak" background="surface">
        <Column gap="16">
          <Row gap="8" vertical="center">
            <div className={styles.pulsingDot} />
            <Text variant="body-default-s" onBackground="brand-strong">NOW PLAYING</Text>
          </Row>
          
          <Row fillWidth gap="16" vertical="center">
            <div className={styles.currentAlbumCover}>
              <img
                src={currentTrack.image}
                alt={`${currentTrack.album} cover`}
                className={styles.albumImage}
              />
            </div>

            <Column flex={1} gap="8">
              <Text variant="heading-strong-l" className={styles.trackName}>
                {currentTrack.name}
              </Text>
              <Text variant="body-default-m" onBackground="neutral-weak">
                {currentTrack.artist}
              </Text>
              <Text variant="body-default-s" onBackground="neutral-weak">
                {currentTrack.album}
              </Text>
              
              {/* Progress bar */}
              <Column gap="4">
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <Row gap="8" horizontal="between">
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {formatDuration(currentTrack.progress_ms || 0)}
                  </Text>
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {formatDuration(currentTrack.duration_ms)}
                  </Text>
                </Row>
              </Column>
            </Column>

            <Button
              href={currentTrack.external_url}
              variant="tertiary"
              size="s"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaExternalLinkAlt />
            </Button>
          </Row>
        </Column>
      </Card>
    );
  };

  const renderTrackList = (tracks: Track[], showTimeAgo = false) => (
    <Column fillWidth gap="12">
      {tracks.map((track) => (
        <Card
          key={track.id}
          fillWidth
          padding="16"
          radius="m"
          border="neutral-alpha-weak"
          background="surface"
          className={styles.trackCard}
        >
          <Row fillWidth gap="12" vertical="center">
            <div className={styles.albumCover}>
              <img
                src={track.image}
                alt={`${track.album} cover`}
                className={styles.albumImage}
              />
              {track.preview_url && (
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={() => playPreview(track)}
                >
                  {currentPlaying === track.id ? <FaPause /> : <FaPlay />}
                </button>
              )}
            </div>

            <Column flex={1} gap="4">
              <Text variant="body-default-m" className={styles.trackName}>
                {track.name}
              </Text>
              <Text variant="body-default-s" onBackground="neutral-weak">
                {track.artist}
              </Text>
              <Row gap="8" vertical="center">
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {formatDuration(track.duration_ms)}
                </Text>
                {showTimeAgo && track.played_at && (
                  <>
                    <Text variant="body-default-xs" onBackground="neutral-weak">•</Text>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      {formatTimeAgo(track.played_at)}
                    </Text>
                  </>
                )}
              </Row>
            </Column>

            <Button
              href={track.external_url}
              variant="tertiary"
              size="s"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaExternalLinkAlt />
            </Button>
          </Row>
        </Card>
      ))}
    </Column>
  );

  const renderPlaylists = () => (
    <Column fillWidth gap="16">
      {playlists.map((playlist) => (
        <Card
          key={playlist.id}
          fillWidth
          padding="20"
          radius="l"
          border="neutral-alpha-weak"
          background="surface"
          className={styles.playlistCard}
        >
          <Row fillWidth gap="16" vertical="center">
            <div className={styles.playlistCover}>
              <img
                src={playlist.image}
                alt={`${playlist.name} playlist cover`}
                className={styles.albumImage}
              />
            </div>

            <Column flex={1} gap="8">
              <Text variant="heading-strong-m" className={styles.trackName}>
                {playlist.name}
              </Text>
              {playlist.description && (
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {playlist.description}
                </Text>
              )}
              <Row gap="8" vertical="center">
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {playlist.tracks_total} tracks
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">•</Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  by {playlist.owner}
                </Text>
              </Row>
            </Column>

            <Button
              href={playlist.external_url}
              variant="tertiary"
              size="s"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaExternalLinkAlt />
            </Button>
          </Row>
        </Card>
      ))}
    </Column>
  );

  if (loading) {
    return (
      <Column fillWidth gap="24" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={24} color="#1DB954" />
          <Text variant="heading-strong-l">Loading music data...</Text>
        </Row>
      </Column>
    );
  }

  return (
    <Column fillWidth gap="32" className={className}>
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={32} color="#1DB954" />
          <Heading variant="heading-strong-xl">My Music</Heading>
        </Row>
      </Column>

      {/* Navigation Tabs */}
      <Row fillWidth horizontal="center" gap="8" className={styles.tabContainer}>
        <Button
          variant={activeTab === 'current' ? 'primary' : 'tertiary'}
          size="s"
          onClick={() => setActiveTab('current')}
        >
          <Row gap="8" vertical="center">
            <FaPlay size={12} />
            Currently Playing
          </Row>
        </Button>
        <Button
          variant={activeTab === 'top' ? 'primary' : 'tertiary'}
          size="s"
          onClick={() => setActiveTab('top')}
        >
          <Row gap="8" vertical="center">
            <FaMusic size={12} />
            Top Tracks
          </Row>
        </Button>
        <Button
          variant={activeTab === 'recent' ? 'primary' : 'tertiary'}
          size="s"
          onClick={() => setActiveTab('recent')}
        >
          <Row gap="8" vertical="center">
            <FaClock size={12} />
            Recently Played
          </Row>
        </Button>
        <Button
          variant={activeTab === 'playlists' ? 'primary' : 'tertiary'}
          size="s"
          onClick={() => setActiveTab('playlists')}
        >
          <Row gap="8" vertical="center">
            <FaList size={12} />
            Playlists
          </Row>
        </Button>
      </Row>

      {/* Content */}
      <Column fillWidth gap="16">
        {activeTab === 'current' && renderCurrentlyPlaying()}
        {activeTab === 'top' && renderTrackList(topTracks)}
        {activeTab === 'recent' && renderTrackList(recentTracks, true)}
        {activeTab === 'playlists' && renderPlaylists()}
      </Column>

      <Row fillWidth horizontal="center">
        <Button
          href="https://open.spotify.com/user/atharvakanherkar" // Replace with your profile
          variant="secondary"
          size="m"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Row gap="8" vertical="center">
            <FaSpotify />
            Follow on Spotify
          </Row>
        </Button>
      </Row>
    </Column>
  );
};
