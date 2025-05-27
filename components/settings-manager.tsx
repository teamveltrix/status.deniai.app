'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Globe, 
  Settings, 
  Download,
  Upload,
  Trash2
} from 'lucide-react';

export function SettingsManager() {
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
              <Input defaultValue="System Status" placeholder="Your site title" />
              <p className="text-sm text-muted-foreground">This will appear in the browser title and page header</p>
            </div>

            <div>
              <label className="text-sm font-medium">Site Description</label>
              <Textarea 
                defaultValue="Current status of all our services"
                placeholder="Your site description" 
              />
              <p className="text-sm text-muted-foreground">This will appear as the page description</p>
            </div>

            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input placeholder="Your company name" />
            </div>

            <div>
              <label className="text-sm font-medium">Support URL</label>
              <Input placeholder="https://support.yourcompany.com" />
            </div>

            <Button>Save Configuration</Button>
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
                <Badge variant="default" className="bg-green-500">Connected</Badge>
                <span className="text-sm text-muted-foreground">PostgreSQL Database</span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Database Actions</h3>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Export your data for backup or import data from another system
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Data
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will permanently delete all services, incidents, and updates. This action cannot be undone.
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
                  <input type="checkbox" id="email-incidents" />
                  <label htmlFor="email-incidents" className="text-sm">Send email when incidents are created</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email-updates" />
                  <label htmlFor="email-updates" className="text-sm">Send email when incidents are updated</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email-resolved" />
                  <label htmlFor="email-resolved" className="text-sm">Send email when incidents are resolved</label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <Input placeholder="https://your-webhook-endpoint.com" />
              <p className="text-sm text-muted-foreground">
                Receive POST requests when incidents are created or updated
              </p>
            </div>

            <Button>Save Notification Settings</Button>
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
              </div>
            </div>

            <div>
              <h3 className="font-medium">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Currently, the API is open. Consider implementing authentication for production use.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
