"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getStatusColor,
  getStatusText,
  getImpactColor,
  getImpactText,
  formatDate,
  formatRelativeTime,
  formatMaintenanceTime,
} from "@/lib/utils";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowLeft,
  Plus
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<ScheduledMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        const response = await fetch("/api/maintenance");
        if (response.ok) {
          const data: ScheduledMaintenance[] = await response.json();
          setMaintenances(data);
        }
      } catch (error) {
        console.error("Error fetching maintenances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenances();
  }, []);

  const getMaintenanceIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-l-green-500";
      case "in_progress":
        return "border-l-orange-500";
      case "cancelled":
        return "border-l-red-500";
      default:
        return "border-l-blue-500";
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Status
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Maintenance History</h1>
            <p className="text-muted-foreground">
              View all scheduled and completed maintenance windows
            </p>
          </div>
        </div>

        {/* Maintenance List */}
        {maintenances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Clock className="w-12 h-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Maintenance Scheduled</h3>
                  <p className="text-muted-foreground">
                    There are currently no maintenance windows scheduled or in our history.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {maintenances.map((maintenance) => (
              <Alert
                key={maintenance.id}
                className={`border-l-4 ${getBorderColor(maintenance.status)}`}
              >
                {getMaintenanceIcon(maintenance.status)}
                <AlertDescription>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg break-words text-foreground">
                          {maintenance.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(
                              maintenance.status
                            )} text-white`}
                          >
                            {getStatusText(maintenance.status)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${getImpactColor(
                              maintenance.impact
                            )} text-white`}
                          >
                            {getImpactText(maintenance.impact)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground sm:whitespace-nowrap sm:ml-4 flex-shrink-0">
                        <div className="font-medium">
                          {formatMaintenanceTime(
                            maintenance.scheduledStartTime,
                            maintenance.scheduledEndTime
                          )}
                        </div>
                        <div className="text-xs">
                          {formatDate(maintenance.scheduledStartTime)} -{" "}
                          {formatDate(maintenance.scheduledEndTime)}
                        </div>
                      </div>
                    </div>

                    {maintenance.description && (
                      <div className="text-sm text-muted-foreground">
                        <p className="whitespace-pre-wrap break-words">
                          {maintenance.description}
                        </p>
                      </div>
                    )}

                    {maintenance.services.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Affected services:{" "}
                        </span>
                        {maintenance.services.map((service, index) => (
                          <span key={service.id}>
                            {service.name}
                            {index < maintenance.services.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Updates */}
                    {maintenance.updates && maintenance.updates.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Updates</h4>
                        <div className="space-y-2">
                          {maintenance.updates.map((update) => (
                            <div key={update.id} className="text-sm border-l-2 border-muted pl-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium break-words">
                                    {update.title}
                                  </span>
                                </div>
                                <span className="text-muted-foreground text-xs sm:text-sm">
                                  {formatRelativeTime(update.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-muted-foreground whitespace-pre-wrap break-words">
                                {update.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>Last updated: {formatDate(new Date())}</p>
          <p className="mt-2 space-x-4">
            <Link href="/" className="hover:text-primary underline">
              Status Page
            </Link>
            <span>•</span>
            <Link href="/incidents" className="hover:text-primary underline">
              Incident History
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
