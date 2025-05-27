"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  getStatusColor,
  getStatusText,
  getImpactColor,
  getImpactText,
  formatDate,
  formatRelativeTime,
  formatMaintenanceTime,
} from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string | null;
  status: "operational" | "degraded" | "partial_outage" | "major_outage";
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
  status: "investigating" | "identified" | "monitoring" | "resolved";
  createdAt: string;
}

interface Incident {
  id: number;
  title: string;
  description: string | null;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "none" | "minor" | "major" | "critical";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  services: (Service & { impact: string })[];
  latestUpdate: IncidentUpdate | null;
  updates?: IncidentUpdate[];
}

interface MaintenanceUpdate {
  id: number;
  maintenanceId: number;
  title: string;
  description: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

interface ScheduledMaintenance {
  id: number;
  title: string;
  description: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  impact: "none" | "minor" | "major" | "critical";
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  createdAt: string;
  updatedAt: string;
  services: (Service & { impact: string })[];
  latestUpdate: MaintenanceUpdate | null;
  updates?: MaintenanceUpdate[];
}

export function StatusPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [maintenance, setMaintenance] = useState<ScheduledMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, incidentsRes, maintenanceRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/incidents"),
          fetch("/api/maintenance?upcoming=true"),
        ]);
        if (servicesRes.ok) {
          const servicesData: Service[] = await servicesRes.json();
          setServices(servicesData.filter((s) => s.isVisible));
        }
        if (incidentsRes.ok) {
          const incidentsData: Incident[] = await incidentsRes.json();
          // Show recent incidents (active first, then recently resolved)
          const activeIncidents = incidentsData.filter(
            (i) => i.status !== "resolved"
          );
          const recentResolvedIncidents = incidentsData
            .filter((i) => i.status === "resolved")
            .slice(0, 3); // Show last 3 resolved incidents
          setIncidents(
            [...activeIncidents, ...recentResolvedIncidents].slice(0, 5)
          );
        }
        if (maintenanceRes.ok) {
          const maintenanceData: ScheduledMaintenance[] =
            await maintenanceRes.json();
          // Show upcoming and in-progress maintenance
          const upcomingMaintenance = maintenanceData.filter(
            (m) => m.status === "scheduled" || m.status === "in_progress"
          );
          setMaintenance(upcomingMaintenance.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getOverallStatus = () => {
    if (services.length === 0)
      return { status: "operational", text: "All Systems Operational" };

    const hasOutages = services.some(
      (s) => s.status === "major_outage" || s.status === "partial_outage"
    );
    const hasDegraded = services.some((s) => s.status === "degraded");

    if (hasOutages) {
      return {
        status: "major_outage",
        text: "Some Systems Experiencing Issues",
      };
    } else if (hasDegraded) {
      return {
        status: "degraded",
        text: "Some Systems Experiencing Degraded Performance",
      };
    }

    return { status: "operational", text: "All Systems Operational" };
  };

  const overallStatus = getOverallStatus();

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Veltrix Status</h1>
          <p className="text-muted-foreground">
            Current status of all our services
          </p>
        </div>
        {/* Overall Status */}
        <Card className="mb-8">
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  overallStatus.status
                )}`}
              ></div>
              <span className="text-lg font-medium">{overallStatus.text}</span>
              {overallStatus.status === "operational" && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {overallStatus.status !== "operational" && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>{" "}

        {/* Scheduled Maintenance */}
        {maintenance.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Scheduled Maintenance</h2>
              <a
                href="/maintenance"
                className="text-sm text-primary hover:underline flex items-center"
              >
                View All Maintenance
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>{" "}
            <div className="space-y-4">
              {maintenance.map((maintenanceItem) => (
                <Alert
                  key={maintenanceItem.id}
                  className={`border-l-4 ${
                    maintenanceItem.status === "completed"
                      ? "border-l-green-500"
                      : maintenanceItem.status === "in_progress"
                      ? "border-l-orange-500"
                      : "border-l-blue-500"
                  }`}
                >
                  {maintenanceItem.status === "completed" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : maintenanceItem.status === "in_progress" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold break-words">
                            {maintenanceItem.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(
                                maintenanceItem.status
                              )} text-white`}
                            >
                              {getStatusText(maintenanceItem.status)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${getImpactColor(
                                maintenanceItem.impact
                              )} text-white`}
                            >
                              {getImpactText(maintenanceItem.impact)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground sm:whitespace-nowrap sm:ml-4 flex-shrink-0">
                          <div className="font-medium">
                            {formatMaintenanceTime(
                              maintenanceItem.scheduledStartTime,
                              maintenanceItem.scheduledEndTime
                            )}
                          </div>
                          <div className="text-xs">
                            {formatDate(maintenanceItem.scheduledStartTime)} -{" "}
                            {formatDate(maintenanceItem.scheduledEndTime)}
                          </div>
                        </div>
                      </div>

                      {maintenanceItem.services.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Affected services:{" "}
                          </span>
                          {maintenanceItem.services.map((service, index) => (
                            <span key={service.id}>
                              {service.name}
                              {index < maintenanceItem.services.length - 1 &&
                                ", "}
                            </span>
                          ))}
                        </div>
                      )}

                      {maintenanceItem.latestUpdate && (
                        <div className="text-sm border-l-2 border-muted pl-3 mt-2 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium break-words">
                                {maintenanceItem.latestUpdate.title}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              {formatRelativeTime(
                                maintenanceItem.latestUpdate.createdAt
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap break-words">
                            {maintenanceItem.latestUpdate.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
        
        {/* Services Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <Card>
            <CardContent className="p-0">
              {services.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No services configured
                </div>
              ) : (
                <div className="divide-y">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            service.status
                          )}`}
                        ></div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{service.name}</h3>
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
                          {service.description && (
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          service.status === "operational"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          service.status === "operational"
                            ? "bg-green-500 text-white"
                            : `${getStatusColor(service.status)} text-white`
                        }
                      >
                        {getStatusText(service.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>{" "}
        </div>{" "}
        
        {/* Recent Incidents */}
        {incidents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Incidents</h2>
              <a
                href="/incidents"
                className="text-sm text-primary hover:underline flex items-center"
              >
                View All Incidents
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>{" "}
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Alert
                  key={incident.id}
                  className={`border-l-4 ${
                    incident.status === "resolved"
                      ? "border-l-green-500"
                      : "border-l-orange-500"
                  }`}
                >
                  {incident.status === "resolved" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2 w-full">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{incident.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(
                                incident.status
                              )} text-white`}
                            >
                              {getStatusText(incident.status)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${getImpactColor(
                                incident.impact
                              )} text-white`}
                            >
                              {getImpactText(incident.impact)}
                            </Badge>
                            {/* {incident.status === 'resolved' && (
                              <Badge variant="default" className="bg-green-500 text-white">
                                Resolved
                              </Badge>
                            )} */}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                          <div>{formatRelativeTime(incident.createdAt)}</div>
                          {incident.resolvedAt && (
                            <div className="text-xs text-green-600">
                              Resolved {formatRelativeTime(incident.resolvedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      {incident.services.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Affected services:{" "}
                          </span>
                          {incident.services.map((service, index) => (
                            <span key={service.id}>
                              {service.name}
                              {index < incident.services.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      )}

                      {incident.latestUpdate && (
                        <div className="text-sm border-l-2 border-muted pl-3 mt-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">
                              {incident.latestUpdate.title}
                            </span>
                            <span className="text-muted-foreground">
                              {formatRelativeTime(
                                incident.latestUpdate.createdAt
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {incident.latestUpdate.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Last updated: {formatDate(new Date())}</p>{" "}
          <p className="mt-2 space-x-4">
            <a href="/incidents" className="hover:text-primary underline">
              Incident History
            </a>
            <span>•</span>
            <a href="/dashboard" className="hover:text-primary underline">
              Admin Dashboard
            </a>
            <span>•</span>
            <a href="/auth/signin" className="hover:text-primary underline">
              Admin Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
