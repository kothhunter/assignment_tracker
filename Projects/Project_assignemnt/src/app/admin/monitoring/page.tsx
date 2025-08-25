'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
  responseTime: string;
  database?: string;
  openai?: string;
  uptime?: number;
  memory?: {
    used: number;
    total: number;
    external: number;
  };
  checks?: {
    database?: any;
    openai?: any;
    environment?: any;
    system?: any;
  };
}

export default function MonitoringDashboard() {
  const [basicHealth, setBasicHealth] = useState<HealthStatus | null>(null);
  const [detailedHealth, setDetailedHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic health
      const basicResponse = await fetch('/api/health');
      const basicData = await basicResponse.json();
      setBasicHealth(basicData);

      // Fetch detailed health
      const detailedResponse = await fetch('/api/health/detailed');
      const detailedData = await detailedResponse.json();
      setDetailedHealth(detailedData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading && !basicHealth) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
          </span>
          <Button 
            onClick={fetchHealthData} 
            disabled={loading}
            size="sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {basicHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              System Status
              <Badge className={getStatusColor(basicHealth.status)}>
                {basicHealth.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Environment</p>
                <p className="text-2xl font-bold">{basicHealth.environment}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Version</p>
                <p className="text-2xl font-bold">{basicHealth.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Response Time</p>
                <p className="text-2xl font-bold">{basicHealth.responseTime}</p>
              </div>
              {detailedHealth?.uptime && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-2xl font-bold">{formatUptime(detailedHealth.uptime)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Database
              <Badge className={getStatusColor(
                detailedHealth?.checks?.database?.status || basicHealth?.database === 'connected' ? 'healthy' : 'unhealthy'
              )}>
                {detailedHealth?.checks?.database?.status || (basicHealth?.database === 'connected' ? 'healthy' : 'unhealthy')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailedHealth?.checks?.database && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Response Time:</strong> {detailedHealth.checks.database.responseTime}
                </p>
                {detailedHealth.checks.database.tables && (
                  <div>
                    <p className="text-sm font-medium">Tables:</p>
                    <ul className="text-sm text-gray-600">
                      {Object.entries(detailedHealth.checks.database.tables).map(([table, status]) => (
                        <li key={table}>{table}: {status as string}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OpenAI Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              OpenAI API
              <Badge className={getStatusColor(
                detailedHealth?.checks?.openai?.status === 'configured' ? 'healthy' : 'degraded'
              )}>
                {detailedHealth?.checks?.openai?.status || basicHealth?.openai || 'unknown'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailedHealth?.checks?.openai && (
              <div className="space-y-2">
                {detailedHealth.checks.openai.responseTime && (
                  <p className="text-sm">
                    <strong>Response Time:</strong> {detailedHealth.checks.openai.responseTime}
                  </p>
                )}
                {detailedHealth.checks.openai.message && (
                  <p className="text-sm text-gray-600">
                    {detailedHealth.checks.openai.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Resources */}
        {detailedHealth?.memory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Used:</strong> {detailedHealth.memory.used} MB
                </p>
                <p className="text-sm">
                  <strong>Total:</strong> {detailedHealth.memory.total} MB
                </p>
                <p className="text-sm">
                  <strong>External:</strong> {detailedHealth.memory.external} MB
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(detailedHealth.memory.used / detailedHealth.memory.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Variables */}
        {detailedHealth?.checks?.environment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Environment
                <Badge className={getStatusColor(detailedHealth.checks.environment.status)}>
                  {detailedHealth.checks.environment.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Configured:</strong> {detailedHealth.checks.environment.configured}/{detailedHealth.checks.environment.required}
                </p>
                {detailedHealth.checks.environment.missing.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600">Missing:</p>
                    <ul className="text-sm text-red-500">
                      {detailedHealth.checks.environment.missing.map((envVar: string) => (
                        <li key={envVar}>• {envVar}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Information */}
        {detailedHealth?.checks?.system && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Node:</strong> {detailedHealth.checks.system.nodeVersion}
                </p>
                <p className="text-sm">
                  <strong>Platform:</strong> {detailedHealth.checks.system.platform}
                </p>
                <p className="text-sm">
                  <strong>Architecture:</strong> {detailedHealth.checks.system.arch}
                </p>
                <p className="text-sm">
                  <strong>PID:</strong> {detailedHealth.checks.system.pid}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Raw Data (Development) */}
      {process.env.NODE_ENV === 'development' && detailedHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw Health Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(detailedHealth, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}