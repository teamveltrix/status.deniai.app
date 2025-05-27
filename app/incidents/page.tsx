'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { getStatusColor, getStatusText, getImpactColor, getImpactText, formatDate, formatRelativeTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  description: string | null;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  url: string | null;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IncidentUpdate {
  id: number;
  incidentId: number;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
}

interface Incident {
  id: number;
  title: string;
  description: string | null;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'none' | 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  services: (Service & { impact: string })[];
  latestUpdate: IncidentUpdate | null;
  updates?: IncidentUpdate[];
}

export default function IncidentsPage() {
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents');
        if (response.ok) {
          const incidentsData: Incident[] = await response.json();
          setAllIncidents(incidentsData);
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const activeIncidents = allIncidents.filter(incident => incident.status !== 'resolved');
  const resolvedIncidents = allIncidents.filter(incident => incident.status === 'resolved');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Status
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Incident History</h1>
          <p className="text-muted-foreground">Complete history of all incidents and their updates</p>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Active Incidents ({activeIncidents.length})
            </h2>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} showAllUpdates />
              ))}
            </div>
          </div>
        )}

        {/* Resolved Incidents */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Incident History ({resolvedIncidents.length})
          </h2>
          {resolvedIncidents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No incidents to display
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resolvedIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} showAllUpdates />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Last updated: {formatDate(new Date())}</p>
          <p className="mt-2 space-x-4">
            <Link href="/" className="hover:text-primary underline">
              Status Page
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-primary underline">
              Admin Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

interface IncidentCardProps {
  incident: Incident;
  showAllUpdates?: boolean;
}

function IncidentCard({ incident, showAllUpdates = false }: IncidentCardProps) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);

  const fetchUpdates = async () => {
    if (updates.length > 0) {
      setShowUpdates(!showUpdates);
      return;
    }

    setLoadingUpdates(true);
    try {
      const response = await fetch(`/api/incidents/${incident.id}/updates`);
      if (response.ok) {
        const updatesData: IncidentUpdate[] = await response.json();
        setUpdates(updatesData);
        setShowUpdates(true);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoadingUpdates(false);
    }
  };

  return (
    <Card className={`border-l-4 ${incident.status === 'resolved' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{incident.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={`${getStatusColor(incident.status)} text-white`}>
                {getStatusText(incident.status)}
              </Badge>
              <Badge variant="outline" className={`${getImpactColor(incident.impact)} text-white`}>
                {getImpactText(incident.impact)}
              </Badge>
              {/* {incident.resolvedAt && (
                <Badge variant="default" className="bg-green-500 text-white">
                  Resolved
                </Badge>
              )} */}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Started: {formatDate(incident.createdAt)}</div>
            <div className="text-xs">{formatRelativeTime(incident.createdAt)}</div>
            {incident.resolvedAt && (
              <>
                <div className="mt-1">Resolved: {formatDate(incident.resolvedAt)}</div>
                <div className="text-xs">{formatRelativeTime(incident.resolvedAt)}</div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {incident.description && (
          <p className="text-muted-foreground mb-4">{incident.description}</p>
        )}

        {/* Affected Services */}
        {incident.services.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Affected Services:</h4>
            <div className="flex flex-wrap gap-2">
              {incident.services.map((service) => (
                <div key={service.id} className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs">
                    {service.name}
                  </Badge>
                  {service.url && (
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Update */}
        {incident.latestUpdate && (
          <div className="border-l-2 border-muted pl-4 mb-4">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium text-sm">{incident.latestUpdate.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(incident.latestUpdate.createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{incident.latestUpdate.description}</p>
          </div>
        )}

        {/* Show All Updates Button */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUpdates}
            disabled={loadingUpdates}
          >
            {loadingUpdates ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
            ) : null}
            {showUpdates ? 'Hide Updates' : 'Show All Updates'}
          </Button>
        </div>

        {/* All Updates */}
        {showUpdates && (
          <div className="mt-4 space-y-3">
            <Separator />
            <h4 className="font-medium text-sm">Update History:</h4>
            <div className="space-y-3">
              {updates.map((update, index) => (
                <div key={update.id} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className={`${getStatusColor(update.status)} text-white text-xs`}>
                      {getStatusText(update.status)}
                    </Badge>
                    <span className="font-medium text-sm">{update.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(update.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{update.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
