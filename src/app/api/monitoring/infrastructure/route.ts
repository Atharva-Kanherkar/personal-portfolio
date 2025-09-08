import { NextResponse } from 'next/server';

// Simulate real infrastructure metrics
export async function GET() {
  // Simulate metrics that would typically come from Prometheus/Grafana
  const now = Date.now();
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  
  // Generate realistic metrics with some randomness
  const metrics = {
    infrastructure: {
      cpu_usage: Math.random() * 30 + 20, // 20-50%
      memory_usage: Math.random() * 40 + 40, // 40-80%
      disk_usage: Math.random() * 20 + 60, // 60-80%
      network_io: {
        inbound_mbps: Math.random() * 100 + 50,
        outbound_mbps: Math.random() * 80 + 30,
      },
    },
    database: {
      connections: Math.floor(Math.random() * 50) + 10,
      query_time_avg: Math.random() * 20 + 5, // 5-25ms
      cache_hit_ratio: Math.random() * 10 + 85, // 85-95%
    },
    api_performance: {
      requests_per_minute: Math.floor(Math.random() * 200) + 100,
      success_rate: Math.random() * 5 + 95, // 95-100%
      p95_response_time: Math.random() * 50 + 100, // 100-150ms
      p99_response_time: Math.random() * 100 + 200, // 200-300ms
    },
    cdn: {
      cache_hit_ratio: Math.random() * 10 + 85, // 85-95%
      bandwidth_usage_gb: Math.random() * 50 + 100,
      origin_requests: Math.floor(Math.random() * 1000) + 500,
    },
    security: {
      blocked_requests: Math.floor(Math.random() * 50) + 10,
      ssl_certificate_days_until_expiry: 45,
      firewall_rules_triggered: Math.floor(Math.random() * 20) + 5,
    },
    availability: {
      uptime_percentage: Math.random() * 1 + 99, // 99-100%
      incidents_today: Math.floor(Math.random() * 2), // 0-1
      mean_time_to_recovery: Math.random() * 30 + 15, // 15-45 minutes
    },
    cost_optimization: {
      monthly_spend: Math.random() * 200 + 800, // $800-$1000
      cost_per_request: Math.random() * 0.001 + 0.002, // $0.002-$0.003
      unused_resources: Math.floor(Math.random() * 5) + 2,
    },
    timestamp: new Date().toISOString(),
    collection_time_ms: Math.random() * 50 + 10, // Simulated collection time
  };

  // Add some alerts based on thresholds
  const alerts = [];
  
  if (metrics.infrastructure.cpu_usage > 80) {
    alerts.push({
      severity: 'warning',
      message: 'High CPU usage detected',
      metric: 'cpu_usage',
      value: metrics.infrastructure.cpu_usage,
      threshold: 80,
    });
  }
  
  if (metrics.infrastructure.memory_usage > 85) {
    alerts.push({
      severity: 'critical',
      message: 'Memory usage approaching limit',
      metric: 'memory_usage',
      value: metrics.infrastructure.memory_usage,
      threshold: 85,
    });
  }
  
  if (metrics.api_performance.success_rate < 98) {
    alerts.push({
      severity: 'warning',
      message: 'API success rate below target',
      metric: 'success_rate',
      value: metrics.api_performance.success_rate,
      threshold: 98,
    });
  }

  return NextResponse.json({
    ...metrics,
    alerts,
    status: alerts.length === 0 ? 'healthy' : alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning',
  });
}
