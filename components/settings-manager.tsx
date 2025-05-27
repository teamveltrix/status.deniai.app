"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Database,
  Globe,
  Settings,
  Download,
  Upload,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

interface SettingValue {
  value: any;
  type: string;
  description?: string;
}

interface SettingsData {
  siteTitle: SettingValue;
  siteDescription: SettingValue;
  companyName: SettingValue;
  supportUrl: SettingValue;
  emailIncidents: SettingValue;
  emailUpdates: SettingValue;
  emailResolved: SettingValue;
  webhookUrl: SettingValue;
}

interface DatabaseStatus {
  status: string;
  database?: string;
  statistics?: {
    services: number;
    incidents: number;
    maintenance: number;
  };
}

export function SettingsManager() {
  const [settings, setSettings] = useState<SettingsData>({
    siteTitle: { value: "System Status", type: "string" },
    siteDescription: {
      value: "Current status of all our services",
      type: "string",
    },
    companyName: { value: "", type: "string" },
    supportUrl: { value: "", type: "string" },
    emailIncidents: { value: false, type: "boolean" },
    emailUpdates: { value: false, type: "boolean" },
    emailResolved: { value: false, type: "boolean" },
    webhookUrl: { value: "", type: "string" },
  });

  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    status: "checking",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadDatabaseStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings((prev: SettingsData) => ({
          ...prev,
          ...(data as Record<string, SettingValue>),
        }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const loadDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/database");
      if (response.ok) {
        const data = (await response.json()) as DatabaseStatus;
        setDbStatus(data);
      } else {
        setDbStatus({ status: "disconnected" });
      }
    } catch (error) {
      console.error("Failed to load database status:", error);
      setDbStatus({ status: "disconnected" });
    }
  };

  const saveSettings = async (section: string) => {
    setSaving(section);
    try {
      let settingsToSave: Record<string, SettingValue> = {};

      if (section === "site") {
        settingsToSave = {
          siteTitle: {
            value: settings.siteTitle.value,
            type: "string",
            description: "Site title displayed in browser",
          },
          siteDescription: {
            value: settings.siteDescription.value,
            type: "string",
            description: "Site description for SEO",
          },
          companyName: {
            value: settings.companyName.value,
            type: "string",
            description: "Company name",
          },
          supportUrl: {
            value: settings.supportUrl.value,
            type: "string",
            description: "Support page URL",
          },
        };
      } else if (section === "notifications") {
        settingsToSave = {
          emailIncidents: {
            value: settings.emailIncidents.value,
            type: "boolean",
            description: "Send email when incidents are created",
          },
          emailUpdates: {
            value: settings.emailUpdates.value,
            type: "boolean",
            description: "Send email when incidents are updated",
          },
          emailResolved: {
            value: settings.emailResolved.value,
            type: "boolean",
            description: "Send email when incidents are resolved",
          },
          webhookUrl: {
            value: settings.webhookUrl.value,
            type: "string",
            description: "Webhook URL for notifications",
          },
        };
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleDatabaseAction = async (action: string) => {
    if (
      action === "reset" &&
      !confirm(
        "Are you sure you want to reset all data? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      if (action === "export") {
        const response = await fetch("/api/database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "export" }),
        });

        if (response.ok) {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `status-page-export-${
            new Date().toISOString().split("T")[0]
          }.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else if (action === "reset") {
        const response = await fetch("/api/database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset" }),
        });

        if (response.ok) {
          alert("All data has been reset successfully.");
          await loadDatabaseStatus();
        }
      }
    } catch (error) {
      console.error(`Database ${action} failed:`, error);
      alert(`Failed to ${action} data. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        setLoading(true);
        const response = await fetch("/api/database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "import", data: importData }),
        });

        if (response.ok) {
          alert("Data imported successfully.");
          await loadDatabaseStatus();
        } else {
          throw new Error("Import failed");
        }
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import data. Please check the file format.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6">
        {/* Site Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Site Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Site Title</label>
              <Input
                value={settings.siteTitle.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    siteTitle: { ...prev.siteTitle, value: e.target.value },
                  }))
                }
                placeholder="Your site title"
              />
              <p className="text-sm text-muted-foreground">
                This will appear in the browser title and page header
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Site Description</label>
              <Textarea
                value={settings.siteDescription.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    siteDescription: {
                      ...prev.siteDescription,
                      value: e.target.value,
                    },
                  }))
                }
                placeholder="Your site description"
              />
              <p className="text-sm text-muted-foreground">
                This will appear as the page description
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={settings.companyName.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    companyName: { ...prev.companyName, value: e.target.value },
                  }))
                }
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Support URL</label>
              <Input
                value={settings.supportUrl.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    supportUrl: { ...prev.supportUrl, value: e.target.value },
                  }))
                }
                placeholder="https://support.yourcompany.com"
              />
            </div>

            <Button
              onClick={() => saveSettings("site")}
              disabled={saving === "site"}
            >
              {saving === "site" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Database Connection</h3>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="default"
                  className={
                    dbStatus.status === "connected"
                      ? "bg-green-500"
                      : dbStatus.status === "disconnected" ? "bg-red-500" : ""
                  }
                >
                  {dbStatus.status === "connected"
                    ? "Connected"
                    : dbStatus.status === "checking"
                    ? "Loading"
                    : "Disconnected"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {dbStatus.database || "Database"}
                  {dbStatus.statistics &&
                    ` - ${dbStatus.statistics.services} services, ${dbStatus.statistics.incidents} incidents`}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Database Actions</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleDatabaseAction("export")}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <Button variant="outline" disabled={loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Export your data for backup or import data from another system
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
              <Button
                variant="destructive"
                onClick={() => handleDatabaseAction("reset")}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Data
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will permanently delete all services, incidents, and
                updates. This action cannot be undone.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Notifications</label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-incidents"
                    checked={settings.emailIncidents.value}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        emailIncidents: {
                          ...prev.emailIncidents,
                          value: !!checked,
                        },
                      }))
                    }
                  />
                  <label htmlFor="email-incidents" className="text-sm">
                    Send email when incidents are created
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-updates"
                    checked={settings.emailUpdates.value}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        emailUpdates: {
                          ...prev.emailUpdates,
                          value: !!checked,
                        },
                      }))
                    }
                  />
                  <label htmlFor="email-updates" className="text-sm">
                    Send email when incidents are updated
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-resolved"
                    checked={settings.emailResolved.value}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        emailResolved: {
                          ...prev.emailResolved,
                          value: !!checked,
                        },
                      }))
                    }
                  />
                  <label htmlFor="email-resolved" className="text-sm">
                    Send email when incidents are resolved
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <Input
                value={settings.webhookUrl.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    webhookUrl: { ...prev.webhookUrl, value: e.target.value },
                  }))
                }
                placeholder="https://your-webhook-endpoint.com"
              />
              <p className="text-sm text-muted-foreground">
                Receive POST requests when incidents are created or updated
              </p>
            </div>

            <Button
              onClick={() => saveSettings("notifications")}
              disabled={saving === "notifications"}
            >
              {saving === "notifications" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>API Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">API Endpoints</label>
              <div className="space-y-2 mt-2 text-sm font-mono bg-muted p-3 rounded">
                <div>GET /api/services - List all services</div>
                <div>GET /api/incidents - List all incidents</div>
                <div>GET /api/incidents/:id - Get incident details</div>
                <div>GET /api/settings - Get all settings</div>
                <div>POST /api/settings - Save settings</div>
                <div>GET /api/database - Database status</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Currently, the API is open. Consider implementing authentication
                for production use.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
