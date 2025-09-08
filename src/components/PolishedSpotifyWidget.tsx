"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Column, Row, Text, Heading, Card, Button } from "@once-ui-system/core";
import { FaSpotify, FaPlay, FaPause, FaExternalLinkAlt, FaUser } from 'react-icons/fa';
import styles from './PolishedSpotifyWidget.module.scss';

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

export const PolishedSpotifyWidget: React.FC<PolishedSpotifyWidgetProps> = ({ className }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        if (tracksData.tracks && tracksData.tracks.length > 0) {
          setTracks(tracksData.tracks);
        } else {
          setTracks(demoTracks);
        }
      } else {
        setTracks(demoTracks);
        setError('Using demo tracks');
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
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
    if (!track.preview_url) {
      // Open in Spotify if no preview
      window.open(track.external_url, '_blank');
      return;
    }

    if (currentPlaying === track.id) {
      // Pause current track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentPlaying(null);
    } else {
      // Stop current track if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play new track
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.volume = 0.7;
      
      audioRef.current.play().then(() => {
        setCurrentPlaying(track.id);
      }).catch((error) => {
        console.error('Audio play error:', error);
        // Fallback to opening Spotify
        window.open(track.external_url, '_blank');
      });
      
      // Reset when track ends
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
                  aria-label={currentPlaying === track.id ? 'Pause' : track.preview_url ? 'Play preview' : 'Open in Spotify'}
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
