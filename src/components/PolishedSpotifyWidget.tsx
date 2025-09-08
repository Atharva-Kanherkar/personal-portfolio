"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Column, Row, Text, Heading, Card, Button } from "@once-ui-system/core";
import { FaSpotify, FaPlay, FaPause, FaExternalLinkAlt, FaUser, FaStepForward, FaStepBackward, FaFire, FaClock, FaList, FaMusic } from 'react-icons/fa';
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

interface CurrentlyPlaying {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  external_url: string;
  is_playing: boolean;
  progress_ms: number;
  duration_ms: number;
}

interface SpotifyProfile {
  id: string;
  display_name: string;
  external_urls: { spotify: string };
}

type TabType = 'top-tracks' | 'recent-tracks' | 'playlists' | 'currently-playing';

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
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState<CurrentlyPlaying | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentPlayback, setCurrentPlayback] = useState<SpotifyPlaybackState | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('top-tracks');
  const [tabLoading, setTabLoading] = useState<{ [key in TabType]: boolean }>({
    'top-tracks': false,
    'recent-tracks': false,
    'playlists': false,
    'currently-playing': false,
  });
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
    fetchProfileData();
  }, []);

  const fetchSpotifyData = async () => {
    setTabLoading(prev => ({ ...prev, 'top-tracks': true }));
    try {
      const tracksResponse = await fetch('/api/spotify/top-tracks');

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
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      setTracks(demoTracks);
      setError('Using demo tracks');
    } finally {
      setTabLoading(prev => ({ ...prev, 'top-tracks': false }));
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      const profileResponse = await fetch('/api/spotify/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Spotify profile data:', profileData); // Debug log
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  const fetchRecentTracks = async () => {
    setTabLoading(prev => ({ ...prev, 'recent-tracks': true }));
    try {
      const response = await fetch('/api/spotify/recent-tracks');
      if (response.ok) {
        const data = await response.json();
        setRecentTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Error fetching recent tracks:', err);
    } finally {
      setTabLoading(prev => ({ ...prev, 'recent-tracks': false }));
    }
  };

  const fetchPlaylists = async () => {
    setTabLoading(prev => ({ ...prev, 'playlists': true }));
    try {
      const response = await fetch('/api/spotify/playlists');
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setTabLoading(prev => ({ ...prev, 'playlists': false }));
    }
  };

  const fetchCurrentlyPlaying = async () => {
    setTabLoading(prev => ({ ...prev, 'currently-playing': true }));
    try {
      const response = await fetch('/api/spotify/currently-playing');
      if (response.ok) {
        const data = await response.json();
        setCurrentlyPlayingTrack(data.currentTrack || null);
      }
    } catch (err) {
      console.error('Error fetching currently playing:', err);
    } finally {
      setTabLoading(prev => ({ ...prev, 'currently-playing': false }));
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'recent-tracks':
        if (recentTracks.length === 0) fetchRecentTracks();
        break;
      case 'playlists':
        if (playlists.length === 0) fetchPlaylists();
        break;
      case 'currently-playing':
        fetchCurrentlyPlaying(); // Always refresh
        break;
      case 'top-tracks':
        // Already loaded
        break;
    }
  };

  const handlePlayPreview = (track: Track) => {
    console.log('=== PLAY ATTEMPT ===');
    console.log('Track:', track.name);
    console.log('Preview URL:', track.preview_url);
    console.log('Preview URL type:', typeof track.preview_url);
    console.log('Preview URL length:', track.preview_url?.length);
    
    // Check if preview URL exists and is valid
    if (!track.preview_url || track.preview_url === null || track.preview_url.trim() === '') {
      console.log('NO PREVIEW AVAILABLE - This track has no 30-second preview');
      
      // Instead of opening Spotify immediately, show user a message
      const userWantsSpotify = confirm(
        `"${track.name}" doesn't have a preview available.\n\nWould you like to open it in Spotify instead?`
      );
      
      if (userWantsSpotify) {
        window.open(track.external_url, '_blank');
      }
      return;
    }

    if (currentPlaying === track.id) {
      console.log('PAUSING current track');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentPlaying(null);
    } else {
      console.log('PLAYING preview on your website');
      
      // Stop any currently playing track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Create and play new audio
      try {
        audioRef.current = new Audio(track.preview_url);
        audioRef.current.volume = 0.7;
        
        // Add loading state
        console.log('Loading audio...');
        
        audioRef.current.play().then(() => {
          console.log('SUCCESS - Audio playing on your website!');
          setCurrentPlaying(track.id);
        }).catch((error) => {
          console.error('❌ AUDIO PLAY FAILED:', error);
          
          // Show user what went wrong
          alert(`Audio playback failed: ${error.message}\n\nTrying Spotify instead...`);
          window.open(track.external_url, '_blank');
        });
        
        // Auto-stop when preview ends
        audioRef.current.onended = () => {
          console.log('Preview ended');
          setCurrentPlaying(null);
        };
        
      } catch (error) {
        console.error('❌ AUDIO SETUP FAILED:', error);
        window.open(track.external_url, '_blank');
      }
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


      {/* Beautiful Tabs Navigation */}
      <Row fillWidth gap="8" horizontal="center" className={styles.tabsContainer}>
        {[
          { id: 'top-tracks', label: 'Top Tracks', icon: FaFire },
          { id: 'recent-tracks', label: 'Recent', icon: FaClock },
          { id: 'playlists', label: 'Playlists', icon: FaList },
          { id: 'currently-playing', label: 'Now Playing', icon: FaMusic },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "tertiary"}
            size="s"
            onClick={() => handleTabChange(tab.id as TabType)}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
          >
            <Row gap="8" vertical="center">
              <tab.icon size={14} />
              <Text variant="label-default-s">{tab.label}</Text>
              
            </Row>
          </Button>
        ))}
      </Row>

      {/* Dynamic Content Based on Active Tab */}
      <Column fillWidth gap="16">
        {/* Top Tracks Tab */}
        {activeTab === 'top-tracks' && 
            tracks.slice(0, 6).map((track) => (
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
                      className={`${styles.playButton} ${currentPlaying === track.id ? styles.playing : ''} ${track.preview_url ? styles.hasPreview : styles.noPreview}`}
                      onClick={() => handlePlayPreview(track)}
                      aria-label={
                        currentPlaying === track.id ? 'Pause' : 
                        track.preview_url ? 'Play 30s preview on this website' : 'No preview - open in Spotify'
                      }
                      title={
                        track.preview_url ? 
                          'Play 30-second preview directly on this website' : 
                          'No preview available - will open in Spotify app'
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
                      {track.preview_url && <span style={{ color: '#1DB954', marginLeft: '8px' }}>• Preview available</span>}
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
            ))
        }

        {/* Recent Tracks Tab */}
        {activeTab === 'recent-tracks' && (
            tabLoading['recent-tracks'] ? (
              <Row fillWidth horizontal="center" paddingY="40">
                <Text variant="body-default-m">Loading recent tracks...</Text>
              </Row>
            ) : recentTracks.length > 0 ? (
              recentTracks.slice(0, 6).map((track) => (
                <Card
                  key={`recent-${track.id}`}
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
                        className={`${styles.playButton} ${currentPlaying === track.id ? styles.playing : ''} ${track.preview_url ? styles.hasPreview : styles.noPreview}`}
                        onClick={() => handlePlayPreview(track)}
                      >
                        {currentPlaying === track.id ? <FaPause /> : track.preview_url ? <FaPlay /> : <FaExternalLinkAlt />}
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
                        {track.preview_url && <span style={{ color: '#1DB954', marginLeft: '8px' }}>• Preview available</span>}
                      </Text>
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
              ))
            ) : (
              <Row fillWidth horizontal="center" paddingY="40">
                <Text variant="body-default-m" onBackground="neutral-weak">
                  No recent tracks found
                </Text>
              </Row>
            )
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            tabLoading['playlists'] ? (
              <Row fillWidth horizontal="center" paddingY="40">
                <Text variant="body-default-m">Loading playlists...</Text>
              </Row>
            ) : playlists.length > 0 ? (
              playlists.slice(0, 6).map((playlist) => (
                <Card
                  key={playlist.id}
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
                        src={playlist.image}
                        alt={`${playlist.name} cover`}
                        className={styles.albumImage}
                      />
                    </div>
                    <Column flex={1} gap="8">
                      <Text variant="heading-strong-m" className={styles.trackName}>
                        {playlist.name}
                      </Text>
                      <Text variant="body-default-m" onBackground="neutral-weak">
                        {playlist.tracks_total} tracks
                      </Text>
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        {playlist.description || 'No description'}
                      </Text>
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
              ))
            ) : (
              <Row fillWidth horizontal="center" paddingY="40">
                <Text variant="body-default-m" onBackground="neutral-weak">
                  No playlists found
                </Text>
              </Row>
            )
        )}

        {/* Currently Playing Tab */}
        {activeTab === 'currently-playing' && (
            tabLoading['currently-playing'] ? (
              <Row fillWidth horizontal="center" paddingY="40">
                <Text variant="body-default-m">Checking what's playing...</Text>
              </Row>
            ) : currentlyPlayingTrack ? (
              <Card
                fillWidth
                padding="24"
                radius="l"
                border="brand-alpha-weak"
                background="brand-alpha-weak"
                className={styles.nowPlayingCard}
              >
                <Column fillWidth gap="20">
                  <Row fillWidth gap="16" vertical="center">
                    <div className={`${styles.albumCover} ${styles.nowPlayingCover}`}>
                      <img
                        src={currentlyPlayingTrack.image}
                        alt={`${currentlyPlayingTrack.album} cover`}
                        className={styles.albumImage}
                      />
                      {currentlyPlayingTrack.is_playing && (
                        <div className={styles.playingIndicator}>
                          <FaMusic className={styles.pulsingIcon} />
                        </div>
                      )}
                    </div>
                    <Column flex={1} gap="8">
                      <Text variant="heading-strong-l" className={styles.trackName}>
                        {currentlyPlayingTrack.name}
                      </Text>
                      <Text variant="body-default-l" onBackground="neutral-weak">
                        {currentlyPlayingTrack.artist}
                      </Text>
                      <Text variant="body-default-m" onBackground="neutral-weak">
                        {currentlyPlayingTrack.album}
                      </Text>
                      <Row gap="8" vertical="center">
                        <Text variant="label-default-s" onBackground="brand-weak">
                          {currentlyPlayingTrack.is_playing ? 'Playing' : 'Paused'}
                        </Text>
                        <Text variant="label-default-s" onBackground="brand-weak">
                          •
                        </Text>
                        <Text variant="label-default-s" onBackground="brand-weak">
                          {formatDuration(currentlyPlayingTrack.progress_ms)} / {formatDuration(currentlyPlayingTrack.duration_ms)}
                        </Text>
                      </Row>
                    </Column>
                    <Button
                      href={currentlyPlayingTrack.external_url}
                      variant="secondary"
                      size="m"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Row gap="8" vertical="center">
                        <FaSpotify />
                        Open in Spotify
                      </Row>
                    </Button>
                  </Row>
                </Column>
              </Card>
            ) : (
              <Row fillWidth horizontal="center" paddingY="40">
                <Column gap="12" horizontal="center">
                  <Text variant="body-default-m" onBackground="neutral-weak">
                    Nothing currently playing
                  </Text>
                  <Text variant="body-default-s" onBackground="neutral-weak">
                    Start playing music on Spotify to see it here
                  </Text>
                </Column>
              </Row>
            )
        )}
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
