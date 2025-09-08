"use client";

import { Column, Row, Text, Heading, Button, Card } from "@once-ui-system/core";
import { FaSpotify, FaExternalLinkAlt, FaCopy } from 'react-icons/fa';
import { useState } from 'react';

export default function SpotifySetup() {
  const [copied, setCopied] = useState(false);
  
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/api/spotify/callback` : '';
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Column maxWidth="m" gap="xl" paddingY="24" horizontal="center">
      <Column fillWidth gap="16" horizontal="center">
        <Row gap="12" vertical="center">
          <FaSpotify size={32} color="#1DB954" />
          <Heading variant="heading-strong-xl">Spotify Integration Setup</Heading>
        </Row>
        <Text variant="body-default-l" onBackground="neutral-weak">
          Follow these steps to display your favorite tracks on your portfolio
        </Text>
      </Column>

      <Column fillWidth gap="24">
        {/* Step 1 */}
        <Card fillWidth padding="24" radius="l" border="neutral-alpha-weak">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 1: Create a Spotify App</Heading>
            <Text variant="body-default-m">
              1. Go to the <strong>Spotify Developer Dashboard</strong><br/>
              2. Click "Create an App"<br/>
              3. Fill in your app details<br/>
              4. Copy your Client ID and Client Secret
            </Text>
            <Button
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="m"
            >
              <Row gap="8" vertical="center">
                <FaExternalLinkAlt />
                Open Spotify Dashboard
              </Row>
            </Button>
          </Column>
        </Card>

        {/* Step 2 */}
        <Card fillWidth padding="24" radius="l" border="neutral-alpha-weak">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 2: Set Redirect URI</Heading>
            <Text variant="body-default-m">
              In your Spotify app settings, add this redirect URI:
            </Text>
            <Card padding="12" radius="m" background="surface" border="neutral-alpha-weak">
              <Row gap="8" vertical="center">
                <Text variant="body-default-s" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {redirectUri}
                </Text>
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={() => copyToClipboard(redirectUri)}
                >
                  {copied ? '✓ Copied!' : <FaCopy />}
                </Button>
              </Row>
            </Card>
          </Column>
        </Card>

        {/* Step 3 */}
        <Card fillWidth padding="24" radius="l" border="neutral-alpha-weak">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 3: Set Environment Variables</Heading>
            <Text variant="body-default-m">
              Create a <code>.env.local</code> file in your project root with:
            </Text>
            <Card padding="16" radius="m" background="surface" border="neutral-alpha-weak">
              <Text variant="body-default-s" style={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
{`SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here`}
              </Text>
            </Card>
          </Column>
        </Card>

        {/* Step 4 */}
        <Card fillWidth padding="24" radius="l" border="neutral-alpha-weak">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 4: Get Your Refresh Token</Heading>
            <Text variant="body-default-m">
              After setting up your app and environment variables, click below to authorize and get your refresh token:
            </Text>
            <Button
              href="/api/spotify/auth"
              variant="primary"
              size="m"
            >
              <Row gap="8" vertical="center">
                <FaSpotify />
                Connect Spotify Account
              </Row>
            </Button>
          </Column>
        </Card>

        {/* Step 5 */}
        <Card fillWidth padding="24" radius="l" border="neutral-alpha-weak">
          <Column gap="16">
            <Heading variant="heading-strong-l">Step 5: Test Integration</Heading>
            <Text variant="body-default-m">
              1. Restart your development server: <code>npm run dev</code><br/>
              2. Visit your homepage<br/>
              3. Your Spotify tracks should appear at the bottom!
            </Text>
          </Column>
        </Card>
      </Column>

      <Column fillWidth gap="16" horizontal="center">
        <Text variant="body-default-m" onBackground="neutral-weak">
          Need help? Check the <code>SPOTIFY_SETUP.md</code> file for detailed instructions.
        </Text>
        <Button
          href="/"
          variant="secondary"
          size="m"
        >
          Back to Homepage
        </Button>
      </Column>
    </Column>
  );
}
