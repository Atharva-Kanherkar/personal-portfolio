"use client";

import React, { useState } from 'react';
import { Column, Row, Text, Heading, Card, Button, Input } from "@once-ui-system/core";
import { FaSpotify, FaCopy, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';

export default function SpotifyTokenRefresh() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [authCode, setAuthCode] = useState('');
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string } | null>(null);
  const [copied, setCopied] = useState<'access' | 'refresh' | null>(null);
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string, type: 'access' | 'refresh') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const exchangeCodeForTokens = async () => {
    if (!authCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/spotify/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();
      setTokens(data);
      setStep(3);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const startAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || 'your_client_id';
    const redirectUri = `${window.location.origin}/api/spotify/callback`;
    const scope = 'user-top-read user-read-recently-played user-read-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';
    
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&show_dialog=true`;
    
    window.open(authUrl, '_blank');
    setStep(2);
  };

  return (
    <Column fillWidth gap="xl" paddingY="24" paddingX="24" maxWidth="m" horizontal="center">
      {/* Header */}
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={32} color="#1DB954" />
          <Heading variant="heading-strong-xl">Refresh Spotify Token</Heading>
        </Row>
        <Text variant="body-default-l" onBackground="neutral-weak">
          Generate a new refresh token to fix your Spotify integration
        </Text>
      </Column>

      {/* Step 1: Start Authorization */}
      {step === 1 && (
        <Card padding="24" radius="l" background="surface">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 1: Authorize with Spotify</Heading>
            <Text variant="body-default-m" onBackground="neutral-weak">
              Click the button below to authorize your application with Spotify. This will open a new window.
            </Text>
            <Button onClick={startAuth} variant="primary" size="m">
              <FaSpotify /> Authorize with Spotify
            </Button>
          </Column>
        </Card>
      )}

      {/* Step 2: Get Authorization Code */}
      {step === 2 && (
        <Card padding="24" radius="l" background="surface">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 2: Enter Authorization Code</Heading>
            <Text variant="body-default-m" onBackground="neutral-weak">
              After authorizing, you'll be redirected to a page showing your authorization code. Copy and paste it here:
            </Text>
            <Input
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Paste your authorization code here..."
              size="m"
            />
            <Button 
              onClick={exchangeCodeForTokens} 
              variant="primary" 
              size="m"
              disabled={!authCode.trim() || loading}
            >
              {loading ? 'Processing...' : 'Get Tokens'}
            </Button>
          </Column>
        </Card>
      )}

      {/* Step 3: Copy Tokens */}
      {step === 3 && tokens && (
        <Card padding="24" radius="l" background="surface">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 3: Update Environment Variables</Heading>
            <Text variant="body-default-m" onBackground="neutral-weak">
              Copy these tokens and update your environment variables:
            </Text>
            
            <Column gap="12">
              <Column gap="8">
                <Text variant="body-strong-s">Access Token (for testing):</Text>
                <Card padding="12" radius="m" background="neutral-alpha-weak">
                  <Row gap="8" vertical="center">
                    <Text variant="body-default-xs" style={{ wordBreak: 'break-all', flex: 1 }}>
                      {tokens.access_token}
                    </Text>
                    <Button
                      onClick={() => copyToClipboard(tokens.access_token, 'access')}
                      variant="tertiary"
                      size="s"
                    >
                      {copied === 'access' ? <FaCheck color="#1DB954" /> : <FaCopy />}
                    </Button>
                  </Row>
                </Card>
              </Column>

              <Column gap="8">
                <Text variant="body-strong-s">Refresh Token (add to .env.local):</Text>
                <Card padding="12" radius="m" background="neutral-alpha-weak">
                  <Row gap="8" vertical="center">
                    <Text variant="body-default-xs" style={{ wordBreak: 'break-all', flex: 1 }}>
                      {tokens.refresh_token}
                    </Text>
                    <Button
                      onClick={() => copyToClipboard(tokens.refresh_token, 'refresh')}
                      variant="tertiary"
                      size="s"
                    >
                      {copied === 'refresh' ? <FaCheck color="#1DB954" /> : <FaCopy />}
                    </Button>
                  </Row>
                </Card>
              </Column>
            </Column>

            <Card padding="16" radius="m" background="accent-alpha-weak">
              <Column gap="8">
                <Text variant="body-strong-s">Update your .env.local file:</Text>
                <Text variant="body-default-xs" style={{ fontFamily: 'monospace' }}>
                  SPOTIFY_REFRESH_TOKEN={tokens.refresh_token}
                </Text>
              </Column>
            </Card>

            <Button 
              onClick={() => { window.location.href = '/spotify-analytics'; }} 
              variant="primary" 
              size="m"
            >
              <FaExternalLinkAlt /> Test Analytics Page
            </Button>
          </Column>
        </Card>
      )}

      {/* Instructions */}
      <Card padding="24" radius="l" background="neutral-alpha-weak">
        <Column gap="12">
          <Heading variant="heading-strong-m">Need Help?</Heading>
          <Column gap="8">
            <Text variant="body-default-s" onBackground="neutral-weak">
              • Make sure your Spotify app has the correct redirect URI
            </Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              • The redirect URI should be: {typeof window !== 'undefined' ? `${window.location.origin}/api/spotify/callback` : 'your-domain.com/api/spotify/callback'}
            </Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              • After updating .env.local, restart your development server
            </Text>
          </Column>
        </Column>
      </Card>
    </Column>
  );
}
