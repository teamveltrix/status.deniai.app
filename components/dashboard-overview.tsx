'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusColor, getStatusText, formatRelativeTime } from '@/lib/utils';
import { 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  status: string;
  updatedAt: string;
}

interface Incident {
  id: number;
  title: string;
  status: string;
  impact: string;
  createdAt: string;
  services: Service[];
}

export function DashboardOverview() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, incidentsRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/incidents'),
        ]);

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json() as Service[];
          setServices(servicesData);
        }

        if (incidentsRes.ok) {
          const incidentsData = await incidentsRes.json() as Incident[];
          setIncidents(incidentsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getServiceStats = () => {
    const total = services.length;
    const operational = services.filter(s => s.status === 'operational').length;
    const issues = total - operational;
    return { total, operational, issues };
  };

  const getIncidentStats = () => {
    const total = incidents.length;
    const active = incidents.filter(i => i.status !== 'resolved').length;
    const resolved = total - active;
    return { total, active, resolved };
  };

  const serviceStats = getServiceStats();
  const incidentStats = getIncidentStats();
  const recentIncidents = incidents.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="flex space-x-2">
          <Link href="/dashboard/services">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </Link>
          <Link href="/dashboard/incidents">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {serviceStats.operational} operational, {serviceStats.issues} with issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{serviceStats.operational}</div>
            <p className="text-xs text-muted-foreground">
              {serviceStats.total > 0 ? Math.round((serviceStats.operational / serviceStats.total) * 100) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{incidentStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {incidentStats.resolved} resolved this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time incidents created
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Services Status</span>
              <Link href="/dashboard/services">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No services configured</p>
            ) : (
              <div className="space-y-3">
                {services.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`}></div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <Badge 
                      variant={service.status === 'operational' ? 'default' : 'secondary'}
                      className={service.status === 'operational' ? 'bg-green-500' : getStatusColor(service.status)}
                    >
                      {getStatusText(service.status)}
                    </Badge>
                  </div>
                ))}
                {services.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/dashboard/services">
                      <Button variant="ghost" size="sm">
                        View {services.length - 5} more services
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Incidents</span>
              <Link href="/dashboard/incidents">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No incidents reported</p>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="border-l-2 border-muted pl-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{incident.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className={`${getStatusColor(incident.status)} text-white text-xs`}>
                            {getStatusText(incident.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(incident.createdAt)}
                          </span>
                        </div>
                        {incident.services.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Affects: {incident.services.map(s => s.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
