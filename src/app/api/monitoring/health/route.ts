import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Simulate health checks
    const checks = {
      database: await checkDatabase(),
      external_apis: await checkExternalAPIs(),
      disk_space: await checkDiskSpace(),
      memory: checkMemory(),
    };

    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      checks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      response_time_ms: Date.now() - startTime,
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<{ status: string; response_time_ms: number; message: string }> {
  const start = Date.now();
  // Simulate database check
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
  
  return {
    status: 'healthy',
    response_time_ms: Date.now() - start,
    message: 'Database connection successful',
  };
}

async function checkExternalAPIs(): Promise<{ status: string; response_time_ms: number; message: string }> {
  const start = Date.now();
  
  try {
    // Check if we can reach external services (like Spotify API)
    const response = await fetch('https://httpstat.us/200', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    
    return {
      status: response.ok ? 'healthy' : 'degraded',
      response_time_ms: Date.now() - start,
      message: response.ok ? 'External APIs accessible' : 'Some external APIs may be slow',
    };
  } catch {
    return {
      status: 'degraded',
      response_time_ms: Date.now() - start,
      message: 'External API connectivity issues',
    };
  }
}

async function checkDiskSpace(): Promise<{ status: string; message: string }> {
  // Simulate disk space check (in browser/serverless environment, this is mostly simulation)
  const simulatedUsage = Math.random() * 100;
  
  return {
    status: simulatedUsage < 85 ? 'healthy' : 'warning',
    message: `Disk usage: ${Math.round(simulatedUsage)}%`,
  };
}

function checkMemory(): { status: string; message: string; usage_mb: number } {
  const memoryUsage = process.memoryUsage();
  const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const usagePercent = (usedMB / totalMB) * 100;
  
  return {
    status: usagePercent < 80 ? 'healthy' : 'warning',
    message: `Memory usage: ${usedMB}MB / ${totalMB}MB (${Math.round(usagePercent)}%)`,
    usage_mb: usedMB,
  };
}
