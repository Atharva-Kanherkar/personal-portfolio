"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Column, Row, Text, Heading, Card, Button, Flex } from "@once-ui-system/core";
import { FaSpotify, FaPlay, FaPause, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './SpotifyWidget.module.scss';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  preview_url: string | null;
  external_url: string;
  duration_ms: number;
  popularity: number;
}

interface SpotifyWidgetProps {
  className?: string;
}

export const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ className }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchTopTracks();
  }, []);

  const fetchTopTracks = async () => {
    try {
      const response = await fetch('/api/spotify/top-tracks');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTracks(data.tracks);
      }
    } catch (err) {
      setError('Failed to load Spotify data');
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (track: Track) => {
    if (!track.preview_url) return;

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
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      setCurrentPlaying(track.id);
      
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

  if (loading) {
    return (
      <Column fillWidth gap="24" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={24} color="#1DB954" />
          <Text variant="heading-strong-l">Loading music...</Text>
        </Row>
      </Column>
    );
  }

  if (error) {
    // Show demo tracks when Spotify is not configured
    const demoTracks = [
      {
        id: 'demo1',
        name: 'Swimming Pools (Drank)',
        artist: 'Kendrick Lamar',
        album: 'good kid, m.A.A.d city',
        image: '/images/avatar.png', // Using avatar as fallback
        preview_url: null,
        external_url: 'https://open.spotify.com',
        duration_ms: 231000,
        popularity: 80
      },
      {
        id: 'demo2',
        name: 'Nujabes - Aruarian Dance',
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

    return (
      <Column fillWidth gap="32" className={className}>
        <Column fillWidth gap="16" horizontal="center">
          <Row gap="12" vertical="center">
            <FaSpotify size={32} color="#1DB954" />
            <Heading variant="heading-strong-xl">Currently vibing to</Heading>
          </Row>
          <Text variant="body-default-l" onBackground="neutral-weak">
            Some tracks I've been enjoying lately
          </Text>
        </Column>

        <Column fillWidth gap="16">
          {demoTracks.map((track, index) => (
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

        <Row fillWidth horizontal="center">
          <Text variant="body-default-s" onBackground="neutral-weak">
            Connect Spotify to show your real listening data • <a href="/spotify-setup" style={{ color: '#1DB954' }}>Setup Guide</a>
          </Text>
        </Row>
      </Column>
    );
  }

  return (
    <Column fillWidth gap="32" className={className}>
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={32} color="#1DB954" />
          <Heading variant="heading-strong-xl">Currently vibing to</Heading>
        </Row>
        <Text variant="body-default-l" onBackground="neutral-weak">
          Some of my favorite tracks on repeat
        </Text>
      </Column>

      <Column fillWidth gap="16">
        {tracks.map((track, index) => (
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
                {track.preview_url && (
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={() => playPreview(track)}
                    aria-label={currentPlaying === track.id ? 'Pause' : 'Play preview'}
                  >
                    {currentPlaying === track.id ? <FaPause /> : <FaPlay />}
                  </button>
                )}
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

      <Row fillWidth horizontal="center">
        <Button
          href="https://open.spotify.com/user/atharvakanherkar" // Replace with your Spotify profile
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
