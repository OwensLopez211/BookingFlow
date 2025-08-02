interface RequestStats {
  total: number;
  lastHour: number;
  lastDay: number;
  averageResponseTime: number;
  endpoints: Record<string, number>;
  statusCodes: Record<number, number>;
}

interface CostEstimation {
  totalRequests: number;
  estimatedMonthlyCost: {
    requests: number;
    compute: number;
    total: number;
  };
  dailyProjection: {
    requests: number;
    estimatedDailyCost: number;
  };
}

interface MetricsResponse {
  stats: RequestStats;
  costs: CostEstimation;
  generatedAt: string;
}

/**
 * Get request metrics and cost estimation
 */
export const getMetrics = async (): Promise<MetricsResponse> => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('Token de acceso requerido');
  }

  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com' 
    : 'http://localhost:3001';

  const response = await fetch(`${baseURL}/api/metrics`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener métricas: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Simple client-side request tracking
 */
class ClientMetrics {
  private requests: Array<{
    timestamp: number;
    method: string;
    url: string;
    status: number;
    duration: number;
  }> = [];

  track(method: string, url: string, status: number, duration: number) {
    this.requests.push({
      timestamp: Date.now(),
      method,
      url,
      status,
      duration
    });

    // Keep only last 100 requests
    if (this.requests.length > 100) {
      this.requests.shift();
    }

    console.log(`[CLIENT METRICS] ${method} ${url} - ${status} (${duration}ms)`);
  }

  getStats() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    
    return {
      total: this.requests.length,
      lastHour: this.requests.filter(r => r.timestamp > lastHour).length,
      averageResponseTime: this.requests.length > 0 
        ? Math.round(this.requests.reduce((sum, r) => sum + r.duration, 0) / this.requests.length)
        : 0,
      statusCodes: this.requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    };
  }
}

export const clientMetrics = new ClientMetrics();