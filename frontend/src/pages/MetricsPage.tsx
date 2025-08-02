import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { getMetrics, clientMetrics } from '@/services/metricsService';

interface MetricsData {
  stats: {
    total: number;
    lastHour: number;
    lastDay: number;
    averageResponseTime: number;
    endpoints: Record<string, number>;
    statusCodes: Record<number, number>;
  };
  costs: {
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
  };
  generatedAt: string;
}

export const MetricsPage: React.FC = () => {
  const [serverMetrics, setServerMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientStats = clientMetrics.getStats();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getMetrics();
        setServerMetrics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Métricas y Costos</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {/* Client-side Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Métricas del Cliente (Esta Sesión)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{clientStats.total}</div>
            <div className="text-gray-600">Requests Totales</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{clientStats.lastHour}</div>
            <div className="text-gray-600">Última Hora</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">{clientStats.averageResponseTime}ms</div>
            <div className="text-gray-600">Tiempo Promedio</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(clientStats.statusCodes).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-gray-600">Respuestas</div>
          </Card>
        </div>
      </div>

      {/* Server-side Metrics */}
      {serverMetrics && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Métricas del Servidor</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">{serverMetrics.stats.total}</div>
                <div className="text-gray-600">Total de Requests</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">{serverMetrics.stats.lastDay}</div>
                <div className="text-gray-600">Últimas 24h</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">{serverMetrics.stats.averageResponseTime}ms</div>
                <div className="text-gray-600">Tiempo Promedio</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-600">{serverMetrics.stats.lastHour}</div>
                <div className="text-gray-600">Última Hora</div>
              </Card>
            </div>
          </div>

          {/* Cost Estimation */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Estimación de Costos AWS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  ${serverMetrics.costs.estimatedMonthlyCost.total.toFixed(4)}
                </div>
                <div className="text-gray-600">Costo Mensual Estimado</div>
                <div className="text-sm text-gray-500 mt-1">
                  Requests: ${serverMetrics.costs.estimatedMonthlyCost.requests.toFixed(4)}
                  <br />
                  Compute: ${serverMetrics.costs.estimatedMonthlyCost.compute.toFixed(4)}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  ${serverMetrics.costs.dailyProjection.estimatedDailyCost.toFixed(4)}
                </div>
                <div className="text-gray-600">Costo Diario Proyectado</div>
                <div className="text-sm text-gray-500 mt-1">
                  Basado en actividad de hoy
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {serverMetrics.costs.dailyProjection.requests}
                </div>
                <div className="text-gray-600">Requests Hoy</div>
              </Card>
            </div>
          </div>

          {/* Endpoints Usage */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Endpoints Más Utilizados</h2>
            <Card className="p-4">
              <div className="space-y-2">
                {Object.entries(serverMetrics.stats.endpoints)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([endpoint, count]) => (
                    <div key={endpoint} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-mono text-sm">{endpoint}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Status Codes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Códigos de Estado</h2>
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(serverMetrics.stats.statusCodes).map(([code, count]) => (
                  <div key={code} className="text-center">
                    <div className={`text-2xl font-bold ${
                      code.startsWith('2') ? 'text-green-600' :
                      code.startsWith('4') ? 'text-yellow-600' :
                      code.startsWith('5') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {count}
                    </div>
                    <div className="text-gray-600">{code}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="text-center text-gray-500 text-sm">
            Última actualización: {new Date(serverMetrics.generatedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};