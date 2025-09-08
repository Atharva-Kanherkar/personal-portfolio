import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// In-memory storage for metrics (in production, you'd use Redis/Database)
const metrics = {
  startTime: Date.now(),
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    responseTime: [] as number[],
  },
  endpoints: {} as Record<string, {
    count: number,
    avgResponseTime: number,
    lastAccessed: number,
    errors: number,
  }>,
  systemHealth: {
    lastUpdated: Date.now(),
    status: 'healthy' as 'healthy' | 'warning' | 'critical',
  }
};

export async function GET() {
  const now = Date.now();
  const uptime = now - metrics.startTime;
  
  // Calculate average response time
  const avgResponseTime = metrics.requests.responseTime.length > 0 
    ? metrics.requests.responseTime.reduce((a, b) => a + b, 0) / metrics.requests.responseTime.length 
    : 0;

  // Calculate error rate
  const errorRate = metrics.requests.total > 0 
    ? (metrics.requests.failed / metrics.requests.total) * 100 
    : 0;

  // Get top endpoints
  const topEndpoints = Object.entries(metrics.endpoints)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)
    .map(([endpoint, data]) => ({
      endpoint,
      ...data,
      errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0,
    }));

  // Simulate some additional metrics
  const memoryUsage = process.memoryUsage();
  
  return NextResponse.json({
    uptime: {
      ms: uptime,
      human: formatUptime(uptime),
    },
    requests: {
      total: metrics.requests.total,
      successful: metrics.requests.successful,
      failed: metrics.requests.failed,
      rps: calculateRPS(), // requests per second
    },
    performance: {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
    },
    endpoints: topEndpoints,
    system: {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      },
      status: metrics.systemHealth.status,
      lastHealthCheck: new Date(metrics.systemHealth.lastUpdated).toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, responseTime, success } = body;

    // Update metrics
    metrics.requests.total++;
    if (success) {
      metrics.requests.successful++;
    } else {
      metrics.requests.failed++;
    }

    if (responseTime) {
      metrics.requests.responseTime.push(responseTime);
      // Keep only last 100 response times
      if (metrics.requests.responseTime.length > 100) {
        metrics.requests.responseTime = metrics.requests.responseTime.slice(-100);
      }
    }

    // Update endpoint-specific metrics
    if (endpoint) {
      if (!metrics.endpoints[endpoint]) {
        metrics.endpoints[endpoint] = {
          count: 0,
          avgResponseTime: 0,
          lastAccessed: Date.now(),
          errors: 0,
        };
      }

      const endpointMetrics = metrics.endpoints[endpoint];
      endpointMetrics.count++;
      endpointMetrics.lastAccessed = Date.now();
      
      if (!success) {
        endpointMetrics.errors++;
      }

      if (responseTime) {
        endpointMetrics.avgResponseTime = 
          (endpointMetrics.avgResponseTime * (endpointMetrics.count - 1) + responseTime) / endpointMetrics.count;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording metrics:', error);
    return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 });
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function calculateRPS(): number {
  const timeWindow = 60000; // 1 minute
  const now = Date.now();
  
  // This is simplified - in production you'd track requests with timestamps
  const recentRequests = Object.values(metrics.endpoints)
    .filter(endpoint => now - endpoint.lastAccessed < timeWindow)
    .reduce((sum, endpoint) => sum + endpoint.count, 0);
    
  return Math.round((recentRequests / 60) * 100) / 100;
}
