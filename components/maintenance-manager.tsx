'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getStatusColor, 
  getStatusText, 
  getImpactColor, 
  getImpactText, 
  formatDate,
  formatMaintenanceTime
} from '@/lib/utils';
import { Plus, Edit, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  description: string | null;
  status: string;
  url: string | null;
  isVisible: boolean;
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
  latestUpdate?: {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  } | null;
}

interface MaintenanceFormData {
  title: string;
  description: string;
  impact: "none" | "minor" | "major" | "critical";
  scheduledStartTime: string;
  scheduledEndTime: string;
  serviceIds: number[];
}

export function MaintenanceManager() {
  const [maintenances, setMaintenances] = useState<ScheduledMaintenance[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<ScheduledMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    title: '',
    description: '',
    impact: 'minor',
    scheduledStartTime: '',
    scheduledEndTime: '',
    serviceIds: [],
  });

  useEffect(() => {
    fetchMaintenances();
    fetchServices();
  }, []);

  const fetchMaintenances = async () => {
    try {
      const response = await fetch('/api/maintenance');
      if (response.ok) {
        const data = await response.json();
        setMaintenances(data as ScheduledMaintenance[]);
      }
    } catch (error) {
      console.error('Error fetching maintenances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data as Service[]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMaintenance ? `/api/maintenance/${editingMaintenance.id}` : '/api/maintenance';
      const method = editingMaintenance ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchMaintenances();
        resetForm();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this maintenance?')) {
      try {
        const response = await fetch(`/api/maintenance/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchMaintenances();
        }
      } catch (error) {
        console.error('Error deleting maintenance:', error);
      }
    }
  };

  const handleEdit = (maintenance: ScheduledMaintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      title: maintenance.title,
      description: maintenance.description || '',
      impact: maintenance.impact,
      scheduledStartTime: new Date(maintenance.scheduledStartTime).toISOString().slice(0, 16),
      scheduledEndTime: new Date(maintenance.scheduledEndTime).toISOString().slice(0, 16),
      serviceIds: maintenance.services.map(s => s.id),
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      impact: 'minor',
      scheduledStartTime: '',
      scheduledEndTime: '',
      serviceIds: [],
    });
    setEditingMaintenance(null);
  };

  const handleServiceToggle = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduled Maintenance</h2>
          <p className="text-muted-foreground">Manage scheduled maintenance windows</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Maintenance</DialogTitle>
              <DialogDescription>
                Schedule a maintenance window for your services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Database Server Maintenance"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impact">Impact Level</Label>
                  <Select
                    value={formData.impact}
                    onValueChange={(value: "none" | "minor" | "major" | "critical") => 
                      setFormData(prev => ({ ...prev, impact: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Impact</SelectItem>
                      <SelectItem value="minor">Minor Impact</SelectItem>
                      <SelectItem value="major">Major Impact</SelectItem>
                      <SelectItem value="critical">Critical Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the maintenance work that will be performed..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Scheduled Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.scheduledStartTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Scheduled End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.scheduledEndTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affected Services</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.serviceIds.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Maintenance</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Maintenance</DialogTitle>
            <DialogDescription>
              Update the scheduled maintenance details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Database Server Maintenance"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-impact">Impact Level</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: "none" | "minor" | "major" | "critical") => 
                    setFormData(prev => ({ ...prev, impact: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Impact</SelectItem>
                    <SelectItem value="minor">Minor Impact</SelectItem>
                    <SelectItem value="major">Major Impact</SelectItem>
                    <SelectItem value="critical">Critical Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the maintenance work that will be performed..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Scheduled Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={formData.scheduledStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Scheduled End Time</Label>
                <Input
                  id="edit-endTime"
                  type="datetime-local"
                  value={formData.scheduledEndTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Affected Services</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-service-${service.id}`}
                      checked={formData.serviceIds.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <Label htmlFor={`edit-service-${service.id}`} className="text-sm">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Maintenance</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
          <CardDescription>
            View and manage all scheduled maintenance windows
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maintenances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No maintenance scheduled</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>Affected Services</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(maintenance.status)}
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(maintenance.status)} text-white`}
                        >
                          {getStatusText(maintenance.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{maintenance.title}</div>
                        {maintenance.description && (
                          <div className="text-sm text-muted-foreground">
                            {maintenance.description.slice(0, 50)}
                            {maintenance.description.length > 50 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getImpactColor(maintenance.impact)} text-white`}
                      >
                        {getImpactText(maintenance.impact)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(maintenance.scheduledStartTime)}</div>
                        <div className="text-muted-foreground">
                          {formatMaintenanceTime(maintenance.scheduledStartTime, maintenance.scheduledEndTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {maintenance.services.length > 0 ? (
                          <span>{maintenance.services.map(s => s.name).join(', ')}</span>
                        ) : (
                          <span className="text-muted-foreground">No services</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(maintenance)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(maintenance.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
