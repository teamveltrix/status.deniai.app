import { relations } from 'drizzle-orm';
import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const serviceStatusEnum = pgEnum('service_status', ['operational', 'degraded', 'partial_outage', 'major_outage']);
export const incidentStatusEnum = pgEnum('incident_status', ['investigating', 'identified', 'monitoring', 'resolved']);
export const incidentImpactEnum = pgEnum('incident_impact', ['none', 'minor', 'major', 'critical']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Services table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: serviceStatusEnum('status').notNull().default('operational'),
  url: varchar('url', { length: 500 }),
  order: integer('order').default(0),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Incidents table
export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: incidentStatusEnum('status').notNull().default('investigating'),
  impact: incidentImpactEnum('impact').notNull().default('minor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// Incident Updates table
export const incidentUpdates = pgTable('incident_updates', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: incidentStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Incident Services (many-to-many relationship)
export const incidentServices = pgTable('incident_services', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  impact: incidentImpactEnum('impact').notNull().default('minor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Incident Components (many-to-many relationship)
export const incidentComponents = pgTable('incident_components', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  componentId: integer('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  impact: incidentImpactEnum('impact').notNull().default('minor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Service Status History
export const serviceStatusHistory = pgTable('service_status_history', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  status: serviceStatusEnum('status').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Scheduled Maintenance table
export const scheduledMaintenance = pgTable('scheduled_maintenance', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: maintenanceStatusEnum('status').notNull().default('scheduled'),
  impact: incidentImpactEnum('impact').notNull().default('minor'),
  scheduledStartTime: timestamp('scheduled_start_time').notNull(),
  scheduledEndTime: timestamp('scheduled_end_time').notNull(),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Maintenance Updates table
export const maintenanceUpdates = pgTable('maintenance_updates', {
  id: serial('id').primaryKey(),
  maintenanceId: integer('maintenance_id').notNull().references(() => scheduledMaintenance.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: maintenanceStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance Services (many-to-many relationship)
export const maintenanceServices = pgTable('maintenance_services', {
  id: serial('id').primaryKey(),
  maintenanceId: integer('maintenance_id').notNull().references(() => scheduledMaintenance.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  impact: incidentImpactEnum('impact').notNull().default('minor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Maintenance Components (many-to-many relationship)
export const maintenanceComponents = pgTable('maintenance_components', {
  id: serial('id').primaryKey(),
  maintenanceId: integer('maintenance_id').notNull().references(() => scheduledMaintenance.id, { onDelete: 'cascade' }),
  componentId: integer('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  impact: incidentImpactEnum('impact').notNull().default('minor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Components table
export const components = pgTable('components', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: serviceStatusEnum('status').notNull().default('operational'),
  order: integer('order').default(0),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('string'), // string, number, boolean, json
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const incidentsRelations = relations(incidents, ({ many }) => ({
  updates: many(incidentUpdates),
  services: many(incidentServices),
  components: many(incidentComponents),
}));

export const incidentUpdatesRelations = relations(incidentUpdates, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentUpdates.incidentId],
    references: [incidents.id],
  }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  incidents: many(incidentServices),
  statusHistory: many(serviceStatusHistory),
  maintenances: many(maintenanceServices),
  components: many(components),
}));

export const incidentServicesRelations = relations(incidentServices, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentServices.incidentId],
    references: [incidents.id],
  }),
  service: one(services, {
    fields: [incidentServices.serviceId],
    references: [services.id],
  }),
}));

export const serviceStatusHistoryRelations = relations(serviceStatusHistory, ({ one }) => ({
  service: one(services, {
    fields: [serviceStatusHistory.serviceId],
    references: [services.id],
  }),
}));

export const componentsRelations = relations(components, ({ one, many }) => ({
  service: one(services, {
    fields: [components.serviceId],
    references: [services.id],
  }),
  incidents: many(incidentComponents),
  maintenances: many(maintenanceComponents),
}));

// Maintenance Relations
export const scheduledMaintenanceRelations = relations(scheduledMaintenance, ({ many }) => ({
  updates: many(maintenanceUpdates),
  services: many(maintenanceServices),
  components: many(maintenanceComponents),
}));

export const maintenanceUpdatesRelations = relations(maintenanceUpdates, ({ one }) => ({
  maintenance: one(scheduledMaintenance, {
    fields: [maintenanceUpdates.maintenanceId],
    references: [scheduledMaintenance.id],
  }),
}));

export const maintenanceServicesRelations = relations(maintenanceServices, ({ one }) => ({
  maintenance: one(scheduledMaintenance, {
    fields: [maintenanceServices.maintenanceId],
    references: [scheduledMaintenance.id],
  }),
  service: one(services, {
    fields: [maintenanceServices.serviceId],
    references: [services.id],
  }),
}));

export const incidentComponentsRelations = relations(incidentComponents, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentComponents.incidentId],
    references: [incidents.id],
  }),
  component: one(components, {
    fields: [incidentComponents.componentId],
    references: [components.id],
  }),
}));

export const maintenanceComponentsRelations = relations(maintenanceComponents, ({ one }) => ({
  maintenance: one(scheduledMaintenance, {
    fields: [maintenanceComponents.maintenanceId],
    references: [scheduledMaintenance.id],
  }),
  component: one(components, {
    fields: [maintenanceComponents.componentId],
    references: [components.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;

export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type NewIncidentUpdate = typeof incidentUpdates.$inferInsert;

export type IncidentService = typeof incidentServices.$inferSelect;
export type NewIncidentService = typeof incidentServices.$inferInsert;

export type ServiceStatusHistory = typeof serviceStatusHistory.$inferSelect;
export type NewServiceStatusHistory = typeof serviceStatusHistory.$inferInsert;

export type ScheduledMaintenance = typeof scheduledMaintenance.$inferSelect;
export type NewScheduledMaintenance = typeof scheduledMaintenance.$inferInsert;

export type MaintenanceUpdate = typeof maintenanceUpdates.$inferSelect;
export type NewMaintenanceUpdate = typeof maintenanceUpdates.$inferInsert;

export type MaintenanceService = typeof maintenanceServices.$inferSelect;
export type NewMaintenanceService = typeof maintenanceServices.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;

export type IncidentComponent = typeof incidentComponents.$inferSelect;
export type NewIncidentComponent = typeof incidentComponents.$inferInsert;

export type MaintenanceComponent = typeof maintenanceComponents.$inferSelect;
export type NewMaintenanceComponent = typeof maintenanceComponents.$inferInsert;
