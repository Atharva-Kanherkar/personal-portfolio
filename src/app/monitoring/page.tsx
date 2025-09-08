'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Column,
  Row,
  Heading,
  Text,
  Button,
  Card,
  Badge,
  RevealFx,
  Line,
} from '@once-ui-system/core';
import styles from './MonitoringDashboard.module.scss';

interface MetricsData {
  uptime: {
    ms: number;
    human: string;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rps: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
  };
  endpoints: Array<{
    endpoint: string;
    count: number;
    avgResponseTime: number;
    errorRate: number;
    lastAccessed: number;
  }>;
  system: {
    memory: {
      used: number;
      total: number;
    };
    status: string;
    lastHealthCheck: string;
  };
  timestamp: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  response_time_ms: number;
  checks: {
    database: { status: string; response_time_ms: number; message: string };
    external_apis: { status: string; response_time_ms: number; message: string };
    disk_space: { status: string; message: string };
    memory: { status: string; message: string; usage_mb: number };
  };
  version: string;
  environment: string;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [metricsResponse, healthResponse] = await Promise.all([
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/health'),
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'brand-weak';
      case 'warning': return 'warning-weak';
      case 'degraded': return 'warning-weak';
      case 'critical':
      case 'unhealthy': return 'danger-weak';
      default: return 'neutral-weak';
    }
  };

  if (loading) {
    return (
      <Column maxWidth="l" gap="xl" paddingY="12" horizontal="center">
        <Text>Loading monitoring dashboard...</Text>
      </Column>
    );
  }

  return (
    <Column maxWidth="l" gap="xl" paddingY="12" horizontal="center">
        <Column fillWidth gap="l">
          <RevealFx translateY="4" fillWidth>
            <Row fillWidth align="center" gap="m">
              <Heading variant="display-strong-l">
                System Monitoring
              </Heading>
              <Badge 
                background={health ? getStatusColor(health.status) : 'neutral-weak'}
                onBackground="neutral-strong"
                textVariant="label-default-s"
              >
                {health?.status.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </Row>
          </RevealFx>

          <RevealFx translateY="8" delay={0.1} fillWidth>
            <Text variant="body-default-l" onBackground="neutral-weak">
              Real-time infrastructure monitoring and performance metrics
            </Text>
          </RevealFx>

          <RevealFx translateY="8" delay={0.2} fillWidth>
            <Row fillWidth gap="s" align="center">
              <Text variant="label-default-s" onBackground="neutral-weak">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Text>
              <Button 
                variant="tertiary" 
                size="s" 
                onClick={fetchData}
                loading={loading}
              >
                Refresh
              </Button>
            </Row>
          </RevealFx>
        </Column>

        {/* System Overview */}
        <RevealFx translateY="12" delay={0.3} fillWidth>
          <Column fillWidth gap="m">
            <Heading variant="heading-strong-l">System Overview</Heading>
            <Row fillWidth gap="m" s={{ direction: 'column' }}>
              <Card fillWidth padding="l" className={styles.metricCard}>
                <Column gap="s">
                  <Text variant="label-default-s" onBackground="neutral-weak">UPTIME</Text>
                  <Heading variant="display-strong-s">{metrics?.uptime.human || 'N/A'}</Heading>
                  <Text variant="label-default-xs" onBackground="brand-weak">
                    Since deployment
                  </Text>
                </Column>
              </Card>

              <Card fillWidth padding="l" className={styles.metricCard}>
                <Column gap="s">
                  <Text variant="label-default-s" onBackground="neutral-weak">REQUESTS</Text>
                  <Heading variant="display-strong-s">{metrics?.requests.total.toLocaleString() || '0'}</Heading>
                  <Text variant="label-default-xs" onBackground="brand-weak">
                    {metrics?.requests.rps || 0} req/sec
                  </Text>
                </Column>
              </Card>

              <Card fillWidth padding="l" className={styles.metricCard}>
                <Column gap="s">
                  <Text variant="label-default-s" onBackground="neutral-weak">RESPONSE TIME</Text>
                  <Heading variant="display-strong-s">{metrics?.performance.avgResponseTime || 0}ms</Heading>
                  <Text variant="label-default-xs" onBackground="brand-weak">
                    Average latency
                  </Text>
                </Column>
              </Card>

              <Card fillWidth padding="l" className={styles.metricCard}>
                <Column gap="s">
                  <Text variant="label-default-s" onBackground="neutral-weak">ERROR RATE</Text>
                  <Heading variant="display-strong-s">{metrics?.performance.errorRate || 0}%</Heading>
                  <Text variant="label-default-xs" onBackground={
                    (metrics?.performance.errorRate || 0) > 5 ? 'danger-weak' : 'brand-weak'
                  }>
                    {metrics?.requests.failed || 0} failed requests
                  </Text>
                </Column>
              </Card>
            </Row>
          </Column>
        </RevealFx>

        {/* Health Checks */}
        {health && (
          <RevealFx translateY="12" delay={0.4} fillWidth>
            <Column fillWidth gap="m">
              <Row fillWidth align="center" gap="s">
                <Heading variant="heading-strong-l">Health Checks</Heading>
                <Text variant="label-default-s" onBackground="neutral-weak">
                  Response time: {health.response_time_ms}ms
                </Text>
              </Row>
              <Column fillWidth gap="s">
                {Object.entries(health.checks).map(([service, check]) => (
                  <Card key={service} fillWidth padding="m" className={styles.healthCard}>
                    <Row fillWidth align="center" gap="m">
                      <Column flex={1} gap="xs">
                        <Text variant="label-default-m" weight="strong">
                          {service.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text variant="body-default-s" onBackground="neutral-weak">
                          {check.message}
                        </Text>
                      </Column>
                      <Badge 
                        background={getStatusColor(check.status)}
                        onBackground="neutral-strong"
                        textVariant="label-default-xs"
                      >
                        {check.status.toUpperCase()}
                      </Badge>
                      {'response_time_ms' in check && (
                        <Text variant="label-default-xs" onBackground="neutral-weak">
                          {check.response_time_ms}ms
                        </Text>
                      )}
                    </Row>
                  </Card>
                ))}
              </Column>
            </Column>
          </RevealFx>
        )}

        {/* Endpoint Analytics */}
        {metrics?.endpoints && metrics.endpoints.length > 0 && (
          <RevealFx translateY="12" delay={0.5} fillWidth>
            <Column fillWidth gap="m">
              <Heading variant="heading-strong-l">Top Endpoints</Heading>
              <Column fillWidth gap="s">
                {metrics.endpoints.map((endpoint, index) => (
                  <Card key={endpoint.endpoint} fillWidth padding="m" className={styles.endpointCard}>
                    <Row fillWidth align="center" gap="m">
                      <Column flex={1} gap="xs">
                        <Text variant="label-default-m" weight="strong">
                          {endpoint.endpoint}
                        </Text>
                        <Row gap="l">
                          <Text variant="body-default-s" onBackground="neutral-weak">
                            {endpoint.count} requests
                          </Text>
                          <Text variant="body-default-s" onBackground="neutral-weak">
                            {Math.round(endpoint.avgResponseTime)}ms avg
                          </Text>
                          <Text variant="body-default-s" onBackground={
                            endpoint.errorRate > 5 ? "danger-weak" : "neutral-weak"
                          }>
                            {endpoint.errorRate.toFixed(1)}% errors
                          </Text>
                        </Row>
                      </Column>
                      <Text variant="label-default-xs" onBackground="neutral-weak">
                        #{index + 1}
                      </Text>
                    </Row>
                  </Card>
                ))}
              </Column>
            </Column>
          </RevealFx>
        )}

        {/* System Resources */}
        {metrics?.system && (
          <RevealFx translateY="12" delay={0.6} fillWidth>
            <Column fillWidth gap="m">
              <Heading variant="heading-strong-l">System Resources</Heading>
              <Row fillWidth gap="m" s={{ direction: 'column' }}>
                <Card fillWidth padding="l" className={styles.resourceCard}>
                  <Column gap="s">
                    <Text variant="label-default-s" onBackground="neutral-weak">MEMORY USAGE</Text>
                    <Row gap="s" align="center">
                      <Heading variant="heading-strong-m">
                        {metrics.system.memory.used}MB
                      </Heading>
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        / {metrics.system.memory.total}MB
                      </Text>
                    </Row>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${(metrics.system.memory.used / metrics.system.memory.total) * 100}%` 
                        }}
                      />
                    </div>
                  </Column>
                </Card>

                <Card fillWidth padding="l" className={styles.resourceCard}>
                  <Column gap="s">
                    <Text variant="label-default-s" onBackground="neutral-weak">ENVIRONMENT</Text>
                    <Text variant="heading-strong-m">{health?.environment?.toUpperCase() || 'UNKNOWN'}</Text>
                    <Text variant="label-default-xs" onBackground="neutral-weak">
                      Version: {health?.version || 'N/A'}
                    </Text>
                  </Column>
                </Card>
              </Row>
            </Column>
          </RevealFx>
        )}

        <RevealFx translateY="12" delay={0.7} fillWidth>
          <Row fillWidth paddingTop="l">
            <Line maxWidth={64} />
          </Row>
        </RevealFx>

        <RevealFx translateY="12" delay={0.8} fillWidth>
          <Column fillWidth gap="s" align="center">
            <Text variant="label-default-s" onBackground="neutral-weak">
              This monitoring dashboard showcases real DevOps and infrastructure monitoring capabilities
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Built with Next.js API routes, real-time metrics collection, and health monitoring
            </Text>
          </Column>
        </RevealFx>
      </Column>
    );
  }
