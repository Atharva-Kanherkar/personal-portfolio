"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Column, Row, Text, Heading, Card, Button } from "@once-ui-system/core";
import { FaSpotify, FaPlay, FaPause, FaExternalLinkAlt, FaUser, FaStepForward, FaStepBackward } from 'react-icons/fa';
import styles from './PolishedSpotifyWidget.module.scss';

// Extend Window interface for Spotify Web Playback SDK
declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

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
}

interface SpotifyProfile {
  id: string;
  display_name: string;
  external_urls: { spotify: string };
}

interface PolishedSpotifyWidgetProps {
  className?: string;
}

interface SpotifyPlaybackState {
  device: {
    id: string;
    is_active: boolean;
    name: string;
    type: string;
    volume_percent: number;
  };
  track_window: {
    current_track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { name: string; images: Array<{ url: string }> };
      uri: string;
    };
  };
  is_playing: boolean;
  position: number;
  duration: number;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: 'ready', callback: (device: { device_id: string }) => void): void;
  addListener(event: 'not_ready', callback: (device: { device_id: string }) => void): void;
  addListener(event: 'player_state_changed', callback: (state: SpotifyPlaybackState | null) => void): void;
  addListener(event: string, callback: (...args: unknown[]) => void): void;
  removeListener(event: string, callback?: (...args: unknown[]) => void): void;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

export const PolishedSpotifyWidget: React.FC<PolishedSpotifyWidgetProps> = ({ className }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentPlayback, setCurrentPlayback] = useState<SpotifyPlaybackState | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<SpotifyPlayer | null>(null);

  // Demo tracks as fallback
  const demoTracks: Track[] = [
    {
      id: 'demo1',
      name: 'Swimming Pools (Drank)',
      artist: 'Kendrick Lamar',
      album: 'good kid, m.A.A.d city',
      image: '/images/avatar.png',
      preview_url: null,
      external_url: 'https://open.spotify.com',
      duration_ms: 231000,
      popularity: 80
    },
    {
      id: 'demo2',
      name: 'Aruarian Dance',
      artist: 'Nujabes',
      album: 'Modal Soul',
      image: '/images/avatar.png',
      preview_url: null,
      external_url: 'https://open.spotify.com',
      duration_ms: 190000,
      popularity: 75
    },
    {
      id: 'demo3',
      name: 'The Less I Know The Better',
      artist: 'Tame Impala',
      album: 'Currents',
      image: '/images/avatar.png',
      preview_url: null,
      external_url: 'https://open.spotify.com',
      duration_ms: 216000,
      popularity: 85
    }
  ];

  useEffect(() => {
    fetchSpotifyData();
  }, []);

  const fetchSpotifyData = async () => {
    try {
      const [tracksResponse, profileResponse] = await Promise.all([
        fetch('/api/spotify/top-tracks'),
        fetch('/api/spotify/profile')
      ]);

      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        console.log('Spotify tracks data:', tracksData); // Debug log
        if (tracksData.tracks && tracksData.tracks.length > 0) {
          console.log('First track preview_url:', tracksData.tracks[0].preview_url); // Debug log
          setTracks(tracksData.tracks);
        } else {
          setTracks(demoTracks);
        }
      } else {
        console.log('Tracks response not ok:', tracksResponse.status);
        setTracks(demoTracks);
        setError('Using demo tracks');
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Spotify profile data:', profileData); // Debug log
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      setTracks(demoTracks);
      setError('Using demo tracks');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPreview = (track: Track) => {
    console.log('handlePlayPreview called for track:', track.name, 'preview_url:', track.preview_url);
    
    if (!track.preview_url || track.preview_url === null || track.preview_url.trim() === '') {
      console.log('No preview URL available, opening in Spotify');
      // Open in Spotify if no preview
      window.open(track.external_url, '_blank');
      return;
    }

    if (currentPlaying === track.id) {
      console.log('Pausing current track');
      // Pause current track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentPlaying(null);
    } else {
      console.log('Playing new track preview:', track.preview_url);
      // Stop current track if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play new track
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.volume = 0.7;
      
      audioRef.current.play().then(() => {
        console.log('Audio started playing successfully');
        setCurrentPlaying(track.id);
      }).catch((error) => {
        console.error('Audio play error:', error);
        // Fallback to opening Spotify
        alert(`Preview unavailable. Error: ${error.message}. Opening in Spotify...`);
        window.open(track.external_url, '_blank');
      });
      
      // Reset when track ends
      audioRef.current.onended = () => {
        console.log('Track preview ended');
        setCurrentPlaying(null);
      };
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    const initializeSpotifyPlayer = async () => {
      // Load Spotify Web Playback SDK
      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        // Wait for SDK to load
        await new Promise<void>((resolve) => {
          window.onSpotifyWebPlaybackSDKReady = () => resolve();
        });
      }

      // Check if user has Spotify Premium (required for Web Playback SDK)
      try {
        const authResponse = await fetch('/api/spotify/profile');
        if (!authResponse.ok) return;

        const authData = await authResponse.json();
        if (authData.product !== 'premium') {
          console.log('Spotify Premium required for playback controls');
          return;
        }

        // Get access token
        const tokenResponse = await fetch('/api/spotify/auth');
        if (!tokenResponse.ok) return;
        
        const { access_token } = await tokenResponse.json();
        
        // Initialize player
        const player = new window.Spotify.Player({
          name: 'Atharva\'s Portfolio Player',
          getOAuthToken: (cb: (token: string) => void) => cb(access_token),
          volume: 0.7
        });

        // Set up event listeners
        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
          setIsSpotifyReady(true);
        });

        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.log('Device ID has gone offline', device_id);
          setIsSpotifyReady(false);
        });

        player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
          if (state) {
            setCurrentPlayback(state);
          }
        });

        // Connect to the player
        await player.connect();
        playerRef.current = player;

      } catch (error) {
        console.log('Spotify playback initialization failed:', error);
      }
    };

    if (profile) {
      initializeSpotifyPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [profile]);

  // Spotify playback controls
  const playTrackOnSpotify = async (trackUri: string) => {
    if (!deviceId || !isSpotifyReady) {
      // Fallback to opening in Spotify app
      const spotifyUrl = trackUri.replace('spotify:track:', 'https://open.spotify.com/track/');
      window.open(spotifyUrl, '_blank');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      // Fallback to opening in Spotify
      const spotifyUrl = trackUri.replace('spotify:track:', 'https://open.spotify.com/track/');
      window.open(spotifyUrl, '_blank');
    }
  };

  const getAccessToken = async (): Promise<string> => {
    const response = await fetch('/api/spotify/auth');
    const data = await response.json();
    return data.access_token;
  };

  const togglePlayback = async () => {
    if (!playerRef.current) return;
    
    try {
      await playerRef.current.togglePlay();
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const skipToNext = async () => {
    if (!playerRef.current) return;
    
    try {
      await playerRef.current.nextTrack();
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  };

  const skipToPrevious = async () => {
    if (!playerRef.current) return;
    
    try {
      await playerRef.current.previousTrack();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  };

  // Enhanced play function that tries Spotify first, then preview
  const handlePlayTrack = async (track: Track) => {
    // Try Spotify playback first
    if (isSpotifyReady && deviceId) {
      const trackUri = `spotify:track:${track.id}`;
      await playTrackOnSpotify(trackUri);
    } else {
      // Fallback to preview playback
      handlePlayPreview(track);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <Column fillWidth gap="24" horizontal="center" className={className}>
        <Row gap="12" vertical="center">
          <FaSpotify size={24} color="#1DB954" />
          <Text variant="heading-strong-l">Loading music...</Text>
        </Row>
      </Column>
    );
  }

  return (
    <Column fillWidth gap="32" className={`${styles.spotifyWidget} ${className || ''}`}>
      {/* Header */}
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={32} color="#1DB954" />
          <Heading variant="heading-strong-xl">Currently vibing to</Heading>
        </Row>
        <Text variant="body-default-l" onBackground="neutral-weak">
          {error ? 'Some tracks I\'ve been enjoying lately' : 'My most-played tracks on Spotify'}
        </Text>
      </Column>

      {/* Spotify Playback Controls (if connected) */}
      {isSpotifyReady && currentPlayback && (
        <Card
          fillWidth
          padding="20"
          radius="l"
          border="brand-alpha-weak"
          background="brand-alpha-weak"
          className={styles.playbackControls}
        >
          <Column fillWidth gap="16">
            <Row fillWidth gap="12" vertical="center">
              <div className={styles.currentTrackCover}>
                <img
                  src={currentPlayback.track_window.current_track.album.images[0]?.url}
                  alt="Currently playing"
                  className={styles.currentTrackImage}
                />
              </div>
              <Column flex={1} gap="4">
                <Text variant="body-strong-m" className={styles.currentTrackName}>
                  {currentPlayback.track_window.current_track.name}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {currentPlayback.track_window.current_track.artists.map(a => a.name).join(', ')}
                </Text>
              </Column>
              <Row gap="8" vertical="center">
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={skipToPrevious}
                  aria-label="Previous track"
                >
                  <FaStepBackward />
                </Button>
                <Button
                  variant="secondary"
                  size="m"
                  onClick={togglePlayback}
                  aria-label={currentPlayback.is_playing ? "Pause" : "Play"}
                >
                  {currentPlayback.is_playing ? <FaPause /> : <FaPlay />}
                </Button>
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={skipToNext}
                  aria-label="Next track"
                >
                  <FaStepForward />
                </Button>
              </Row>
            </Row>
            <Row fillWidth horizontal="center">
              <Text variant="label-default-s" onBackground="brand-weak">
                ♪ Playing on Spotify • Full playback control available
              </Text>
            </Row>
          </Column>
        </Card>
      )}

      {/* Status indicator for Spotify connection */}
      {profile && !isSpotifyReady && (
        <Row fillWidth horizontal="center">
          <Text variant="label-default-s" onBackground="neutral-weak">
            💡 Spotify Premium required for full playback control • Preview mode active
          </Text>
        </Row>
      )}

      {/* Tracks Grid */}
      <Column fillWidth gap="16">
        {tracks.slice(0, 6).map((track) => (
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
              <div className={styles.albumCover}>
                <img
                  src={track.image}
                  alt={`${track.album} cover`}
                  className={styles.albumImage}
                />
                <button
                  type="button"
                  className={`${styles.playButton} ${currentPlaying === track.id ? styles.playing : ''}`}
                  onClick={() => handlePlayPreview(track)}
                  aria-label={
                    currentPlaying === track.id ? 'Pause' : 
                    track.preview_url ? 'Play 30s preview' : 'Open in Spotify'
                  }
                  title={
                    track.preview_url ? '30-second preview' : 'Open in Spotify app'
                  }
                >
                  {currentPlaying === track.id ? (
                    <FaPause />
                  ) : track.preview_url ? (
                    <FaPlay />
                  ) : (
                    <FaExternalLinkAlt />
                  )}
                </button>
              </div>

              <Column flex={1} gap="8">
                <Text variant="heading-strong-m" className={styles.trackName}>
                  {track.name}
                </Text>
                <Text variant="body-default-m" onBackground="neutral-weak">
                  {track.artist}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {track.album} • {formatDuration(track.duration_ms)}
                </Text>
              </Column>

              <Button
                href={track.external_url}
                variant="tertiary"
                size="s"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in Spotify"
              >
                <FaExternalLinkAlt />
              </Button>
            </Row>
          </Card>
        ))}
      </Column>

      {/* Footer */}
      <Row fillWidth horizontal="center">
        {profile ? (
          <Button
            href={profile.external_urls.spotify}
            variant="secondary"
            size="m"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Row gap="8" vertical="center">
              <FaUser />
              Follow @{profile.display_name || profile.id}
            </Row>
          </Button>
        ) : (
          <Text variant="body-default-s" onBackground="neutral-weak">
            {error ? (
              <>Connect Spotify to show real listening data • <a href="/spotify-setup" style={{ color: '#1DB954' }}>Setup Guide</a></>
            ) : (
              'Powered by Spotify'
            )}
          </Text>
        )}
      </Row>
    </Column>
  );
};
