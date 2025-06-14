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
import { getStatusColor, getStatusText } from '@/lib/utils';
import { Plus, Edit, Trash2, ExternalLink, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']).default('operational'),
  order: z.number().min(0).default(0),
  isVisible: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface Component {
  id: number;
  serviceId: number;
  name: string;
  description: string | null;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  components?: Component[];
}

interface Component {
  id: number;
  serviceId: number;
  name: string;
  description: string | null;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Component {
  id: number;
  serviceId: number;
  name: string;
  description: string | null;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

const componentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']).default('operational'),
  order: z.number().min(0).default(0),
  isVisible: z.boolean().default(true),
});

type ComponentFormData = z.infer<typeof componentSchema>;

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Component management state
  const [componentsDialogOpen, setComponentsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      description: '',
      url: '',
      status: 'operational',
      order: 0,
      isVisible: true,
    },
  });

  const {
    register: registerComponent,
    handleSubmit: handleSubmitComponent,
    reset: resetComponent,
    setValue: setComponentValue,
    formState: { errors: componentErrors, isSubmitting: isSubmittingComponent },
  } = useForm<ComponentFormData>({
    defaultValues: {
      name: '',
      description: '',
      status: 'operational',
      order: 0,
      isVisible: true,
    },
  });

  useEffect(() => {
    fetchServices();
  }, []);
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data: Service[] = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchServices();
        setDialogOpen(false);
        reset();
        setEditingService(null);
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setValue('name', service.name);
    setValue('description', service.description || '');
    setValue('url', service.url || '');
    setValue('status', service.status);
    setValue('order', service.order);
    setValue('isVisible', service.isVisible);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingService(null);
    reset();
  };

  // Component management functions
  const fetchComponents = async (serviceId: number) => {
    setComponentsLoading(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/components`);
      if (response.ok) {
        const data: Component[] = await response.json();
        setComponents(data);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setComponentsLoading(false);
    }
  };

  const handleManageComponents = (service: Service) => {
    setSelectedService(service);
    setComponentsDialogOpen(true);
    fetchComponents(service.id);
  };

  const onSubmitComponent = async (data: ComponentFormData) => {
    if (!selectedService) return;

    try {
      const url = editingComponent 
        ? `/api/services/${selectedService.id}/components/${editingComponent.id}`
        : `/api/services/${selectedService.id}/components`;
      const method = editingComponent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchComponents(selectedService.id);
        setComponentDialogOpen(false);
        resetComponent();
        setEditingComponent(null);
      }
    } catch (error) {
      console.error('Error saving component:', error);
    }
  };

  const handleEditComponent = (component: Component) => {
    setEditingComponent(component);
    setComponentValue('name', component.name);
    setComponentValue('description', component.description || '');
    setComponentValue('status', component.status);
    setComponentValue('order', component.order);
    setComponentValue('isVisible', component.isVisible);
    setComponentDialogOpen(true);
  };

  const handleDeleteComponent = async (componentId: number) => {
    if (!selectedService || !confirm('Are you sure you want to delete this component?')) return;
    
    try {
      const response = await fetch(`/api/services/${selectedService.id}/components/${componentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchComponents(selectedService.id);
      }
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  };

  const handleComponentDialogClose = () => {
    setComponentDialogOpen(false);
    setEditingComponent(null);
    resetComponent();
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
        <h1 className="text-3xl font-bold">Services Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input {...register('name')} placeholder="Service name" />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea {...register('description')} placeholder="Service description" />
              </div>

              <div>
                <label className="text-sm font-medium">URL</label>
                <Input {...register('url')} placeholder="https://example.com" />
                {errors.url && (
                  <p className="text-sm text-red-500">{errors.url.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  onValueChange={(value) => setValue('status', value as any)}
                  defaultValue="operational"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="degraded">Degraded Performance</SelectItem>
                    <SelectItem value="partial_outage">Partial Outage</SelectItem>
                    <SelectItem value="major_outage">Major Outage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Order</label>
                <Input
                  type="number"
                  {...register('order', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('isVisible')}
                  id="isVisible"
                  className="rounded"
                />
                <label htmlFor="isVisible" className="text-sm font-medium">
                  Visible on status page
                </label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingService ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No services configured yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${getStatusColor(service.status)} text-white`}
                      >
                        {getStatusText(service.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.url ? (
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isVisible ? 'default' : 'secondary'}>
                        {service.isVisible ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>{service.order}</TableCell>                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageComponents(service)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>          )}
        </CardContent>
      </Card>

      {/* Components Management Dialog */}
      <Dialog open={componentsDialogOpen} onOpenChange={setComponentsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Manage Components - {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Components</h3>
              <Button 
                onClick={() => setComponentDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>

            {componentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No components configured</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{component.name}</div>
                          {component.description && (
                            <div className="text-sm text-muted-foreground">
                              {component.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(component.status)} text-white`}
                        >
                          {getStatusText(component.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={component.isVisible ? 'default' : 'secondary'}>
                          {component.isVisible ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{component.order}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditComponent(component)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteComponent(component.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Component Add/Edit Dialog */}
      <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? 'Edit Component' : 'Add New Component'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitComponent(onSubmitComponent)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input {...registerComponent('name')} placeholder="Component name" />
              {componentErrors.name && (
                <p className="text-sm text-red-500">{componentErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea {...registerComponent('description')} placeholder="Component description" />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                onValueChange={(value) => setComponentValue('status', value as any)}
                defaultValue="operational"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="degraded">Degraded Performance</SelectItem>
                  <SelectItem value="partial_outage">Partial Outage</SelectItem>
                  <SelectItem value="major_outage">Major Outage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Order</label>
              <Input
                type="number"
                {...registerComponent('order', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...registerComponent('isVisible')}
                id="componentVisible"
                className="rounded"
              />
              <label htmlFor="componentVisible" className="text-sm font-medium">
                Visible on status page
              </label>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={isSubmittingComponent}>
                {isSubmittingComponent ? 'Saving...' : editingComponent ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={handleComponentDialogClose}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
