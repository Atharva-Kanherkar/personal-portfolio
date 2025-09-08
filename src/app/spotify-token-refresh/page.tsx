"use client";

import React, { useState } from 'react';
import { Column, Row, Text, Heading, Card, Button, Input } from "@once-ui-system/core";
import { FaSpotify, FaCopy, FaCheck, FaExternalLinkAlt, FaShieldAlt, FaCode, FaArrowRight } from 'react-icons/fa';
import styles from './SpotifyTokenRefresh.module.scss';

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
    <div className={styles.container}>
      <Column fillWidth maxWidth="l" gap="xl" horizontal="center" className={styles.mainContent}>
        {/* Hero Header */}
        <div className={styles.heroSection}>
          <Row gap="16" vertical="center" horizontal="center" className={styles.heroIcon}>
            <FaSpotify size={48} color="#1DB954" />
            <div className={styles.spotifyPulse} />
          </Row>
          <Heading variant="heading-strong-xl" className={styles.heroTitle}>
            Spotify Token Refresh
          </Heading>
          <Text variant="body-default-xl" onBackground="neutral-weak" className={styles.heroSubtitle}>
            Generate secure tokens to power your music analytics
          </Text>
        </div>

        {/* Progress Indicator */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
              <FaShieldAlt />
              <span>Authorize</span>
            </div>
            <div className={`${styles.progressConnector} ${step >= 2 ? styles.active : ''}`} />
            <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
              <FaCode />
              <span>Get Code</span>
            </div>
            <div className={`${styles.progressConnector} ${step >= 3 ? styles.active : ''}`} />
            <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
              <FaCheck />
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className={styles.stepContainer}>
          {/* Step 1: Start Authorization */}
          {step === 1 && (
            <Card padding="32" radius="xl" background="surface" className={styles.stepCard}>
              <Column gap="24" horizontal="center">
                <div className={styles.stepIcon}>
                  <FaShieldAlt size={32} />
                </div>
                <Heading variant="heading-strong-xl" className={styles.stepTitle}>
                  Authorize with Spotify
                </Heading>
                <Text variant="body-default-l" onBackground="neutral-weak" className={styles.stepDescription}>
                  Connect securely to your Spotify account to enable music data access
                </Text>
                <Button 
                  onClick={startAuth} 
                  variant="primary" 
                  size="l"
                  className={styles.primaryButton}
                >
                  <FaSpotify />
                  <span>Authorize with Spotify</span>
                  <FaArrowRight />
                </Button>
              </Column>
            </Card>
          )}

          {/* Step 2: Get Authorization Code */}
          {step === 2 && (
            <Card padding="32" radius="xl" background="surface" className={styles.stepCard}>
              <Column gap="24" horizontal="center">
                <div className={styles.stepIcon}>
                  <FaCode size={32} />
                </div>
                <Heading variant="heading-strong-xl" className={styles.stepTitle}>
                  Enter Authorization Code
                </Heading>
                <Text variant="body-default-l" onBackground="neutral-weak" className={styles.stepDescription}>
                  Copy the authorization code from the Spotify redirect page
                </Text>
                <div className={styles.inputContainer}>
                  <Input
                    id="auth-code"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Paste your authorization code here..."
                    className={styles.codeInput}
                  />
                </div>
                <Button 
                  onClick={exchangeCodeForTokens} 
                  variant="primary" 
                  size="l"
                  disabled={!authCode.trim() || loading}
                  className={styles.primaryButton}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Tokens</span>
                      <FaArrowRight />
                    </>
                  )}
                </Button>
              </Column>
            </Card>
          )}

          {/* Step 3: Copy Tokens */}
          {step === 3 && tokens && (
            <Card padding="32" radius="xl" background="surface" className={styles.stepCard}>
              <Column gap="24" horizontal="center">
                <div className={styles.stepIcon}>
                  <FaCheck size={32} color="#1DB954" />
                </div>
                <Heading variant="heading-strong-xl" className={styles.stepTitle}>
                  Tokens Generated Successfully!
                </Heading>
                <Text variant="body-default-l" onBackground="neutral-weak" className={styles.stepDescription}>
                  Copy your tokens and update your environment variables
                </Text>
                
                <div className={styles.tokensContainer}>
                  {/* Access Token */}
                  <div className={styles.tokenGroup}>
                    <Text variant="body-strong-m" className={styles.tokenLabel}>
                      Access Token
                    </Text>
                    <Card padding="16" radius="l" background="neutral-alpha-weak" className={styles.tokenCard}>
                      <Row gap="12" vertical="center">
                        <Text variant="body-default-s" className={styles.tokenValue}>
                          {tokens.access_token.substring(0, 40)}...
                        </Text>
                        <Button
                          onClick={() => copyToClipboard(tokens.access_token, 'access')}
                          variant="secondary"
                          size="s"
                          className={styles.copyButton}
                        >
                          {copied === 'access' ? <FaCheck color="#1DB954" /> : <FaCopy />}
                        </Button>
                      </Row>
                    </Card>
                  </div>

                  {/* Refresh Token */}
                  <div className={styles.tokenGroup}>
                    <Text variant="body-strong-m" className={styles.tokenLabel}>
                      Refresh Token
                    </Text>
                    <Card padding="16" radius="l" background="accent-alpha-weak" className={styles.tokenCard}>
                      <Row gap="12" vertical="center">
                        <Text variant="body-default-s" className={styles.tokenValue}>
                          {tokens.refresh_token.substring(0, 40)}...
                        </Text>
                        <Button
                          onClick={() => copyToClipboard(tokens.refresh_token, 'refresh')}
                          variant="secondary"
                          size="s"
                          className={styles.copyButton}
                        >
                          {copied === 'refresh' ? <FaCheck color="#1DB954" /> : <FaCopy />}
                        </Button>
                      </Row>
                    </Card>
                  </div>
                </div>

                {/* Environment Setup */}
                <Card padding="20" radius="l" background="brand-alpha-weak" className={styles.envCard}>
                  <Column gap="12">
                    <Text variant="body-strong-m">Update your .env.local file:</Text>
                    <div className={styles.codeBlock}>
                      <Text variant="body-default-s">
                        SPOTIFY_REFRESH_TOKEN={tokens.refresh_token}
                      </Text>
                    </div>
                  </Column>
                </Card>

                <Button 
                  onClick={() => { window.location.href = '/spotify-analytics'; }} 
                  variant="primary" 
                  size="l"
                  className={styles.primaryButton}
                >
                  <FaExternalLinkAlt />
                  <span>Test Analytics Page</span>
                </Button>
              </Column>
            </Card>
          )}
        </div>

        {/* Help Section */}
        <Card padding="24" radius="xl" background="neutral-alpha-weak" className={styles.helpCard}>
          <Column gap="16">
            <Heading variant="heading-strong-l" className={styles.helpTitle}>
              Need Help?
            </Heading>
            <div className={styles.helpGrid}>
              <div className={styles.helpItem}>
                <FaShieldAlt size={20} color="#1DB954" />
                <Text variant="body-default-s">
                  Ensure your Spotify app has the correct redirect URI configured
                </Text>
              </div>
              <div className={styles.helpItem}>
                <FaCode size={20} color="#1DB954" />
                <Text variant="body-default-s">
                  Redirect URI: {typeof window !== 'undefined' ? `${window.location.origin}/api/spotify/callback` : 'your-domain.com/api/spotify/callback'}
                </Text>
              </div>
              <div className={styles.helpItem}>
                <FaArrowRight size={20} color="#1DB954" />
                <Text variant="body-default-s">
                  After updating .env.local, restart your development server
                </Text>
              </div>
            </div>
          </Column>
        </Card>
      </Column>
    </div>
  );
}
