'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { getStatusColor, getStatusText, getImpactColor, getImpactText, formatDate, formatRelativeTime } from '@/lib/utils';
import { Plus, Edit, MessageSquare, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  impact: z.enum(['none', 'minor', 'major', 'critical']),
  serviceIds: z.array(z.number()),
});

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
});

type IncidentFormData = z.infer<typeof incidentSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

interface Service {
  id: number;
  name: string;
  status: string;
}

interface IncidentUpdate {
  id: number;
  title: string;
  description: string;
  status: string;
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
  updates?: IncidentUpdate[];
}

export function IncidentsManager() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const {
    register: registerIncident,
    handleSubmit: handleSubmitIncident,
    reset: resetIncident,
    setValue: setIncidentValue,
    watch: watchIncident,
    formState: { errors: incidentErrors, isSubmitting: isSubmittingIncident },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      description: '',
      impact: 'minor',
      serviceIds: [],
    },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    setValue: setUpdateValue,
    formState: { errors: updateErrors, isSubmitting: isSubmittingUpdate },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'investigating',
    },
  });

  const selectedServiceIds = watchIncident('serviceIds') || [];

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [incidentsRes, servicesRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/services'),
      ]);

      if (incidentsRes.ok) {
        const incidentsData: Incident[] = await incidentsRes.json();
        setIncidents(incidentsData);
      }

      if (servicesRes.ok) {
        const servicesData: Service[] = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitIncident = async (data: IncidentFormData) => {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        setDialogOpen(false);
        resetIncident();
      }
    } catch (error) {
      console.error('Error creating incident:', error);
    }
  };

  const onSubmitUpdate = async (data: UpdateFormData) => {
    if (!selectedIncident) return;

    try {
      const response = await fetch(`/api/incidents/${selectedIncident.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        setUpdateDialogOpen(false);
        resetUpdate();
        setSelectedIncident(null);
      }
    } catch (error) {
      console.error('Error creating update:', error);
    }
  };
  const handleViewDetails = async (incident: Incident) => {
    try {
      const response = await fetch(`/api/incidents/${incident.id}`);
      if (response.ok) {
        const detailedIncident: Incident = await response.json();
        setSelectedIncident(detailedIncident);
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching incident details:', error);
    }
  };

  const handleAddUpdate = (incident: Incident) => {
    setSelectedIncident(incident);
    setUpdateValue('status', incident.status);
    setUpdateDialogOpen(true);
  };

  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    const currentIds = selectedServiceIds;
    if (checked) {
      setIncidentValue('serviceIds', [...currentIds, serviceId]);
    } else {
      setIncidentValue('serviceIds', currentIds.filter(id => id !== serviceId));
    }
  };

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
        <h1 className="text-3xl font-bold">Incidents Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Incident</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitIncident(onSubmitIncident)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input {...registerIncident('title')} placeholder="Incident title" />
                {incidentErrors.title && (
                  <p className="text-sm text-red-500">{incidentErrors.title.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea {...registerIncident('description')} placeholder="Incident description" />
              </div>

              <div>
                <label className="text-sm font-medium">Impact</label>
                <Select
                  onValueChange={(value) => setIncidentValue('impact', value as any)}
                  defaultValue="minor"
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

              <div>
                <label className="text-sm font-medium">Affected Services</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, !!checked)}
                      />
                      <label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={isSubmittingIncident}>
                  {isSubmittingIncident ? 'Creating...' : 'Create Incident'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Incident Update</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Update Title</label>
              <Input {...registerUpdate('title')} placeholder="Update title" />
              {updateErrors.title && (
                <p className="text-sm text-red-500">{updateErrors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea {...registerUpdate('description')} placeholder="Update description" />
              {updateErrors.description && (
                <p className="text-sm text-red-500">{updateErrors.description.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                onValueChange={(value) => setUpdateValue('status', value as any)}
                defaultValue="investigating"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={isSubmittingUpdate}>
                {isSubmittingUpdate ? 'Adding...' : 'Add Update'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedIncident.title}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={`${getStatusColor(selectedIncident.status)} text-white`}>
                    {getStatusText(selectedIncident.status)}
                  </Badge>
                  <Badge className={`${getImpactColor(selectedIncident.impact)} text-white`}>
                    {getImpactText(selectedIncident.impact)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Created: {formatDate(selectedIncident.createdAt)}
                </p>
                {selectedIncident.resolvedAt && (
                  <p className="text-sm text-muted-foreground">
                    Resolved: {formatDate(selectedIncident.resolvedAt)}
                  </p>
                )}
              </div>

              {selectedIncident.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                </div>
              )}

              {selectedIncident.services.length > 0 && (
                <div>
                  <h4 className="font-medium">Affected Services</h4>
                  <div className="space-y-1">
                    {selectedIncident.services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <span className="text-sm">{service.name}</span>
                        <Badge variant="outline" className={`${getImpactColor(service.impact)} text-white text-xs`}>
                          {getImpactText(service.impact)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIncident.updates && selectedIncident.updates.length > 0 && (
                <div>
                  <h4 className="font-medium">Updates</h4>
                  <div className="space-y-3">
                    {selectedIncident.updates.map((update) => (
                      <div key={update.id} className="border-l-2 border-muted pl-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-sm">{update.title}</h5>
                            <Badge variant="secondary" className={`${getStatusColor(update.status)} text-white text-xs mt-1`}>
                              {getStatusText(update.status)}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(update.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{update.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No incidents reported yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Incident
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="font-medium">{incident.title}</div>
                      {incident.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {incident.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(incident.status)} text-white`}>
                        {getStatusText(incident.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getImpactColor(incident.impact)} text-white`}>
                        {getImpactText(incident.impact)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {incident.services.length > 0 ? (
                          <span>{incident.services.length} service(s)</span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatRelativeTime(incident.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(incident)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddUpdate(incident)}
                          disabled={incident.status === 'resolved'}
                        >
                          <MessageSquare className="h-3 w-3" />
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
