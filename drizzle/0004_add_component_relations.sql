CREATE TABLE "incident_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" integer NOT NULL,
	"component_id" integer NOT NULL,
	"impact" "incident_impact" DEFAULT 'minor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"maintenance_id" integer NOT NULL,
	"component_id" integer NOT NULL,
	"impact" "incident_impact" DEFAULT 'minor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incident_components" ADD CONSTRAINT "incident_components_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_components" ADD CONSTRAINT "incident_components_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_components" ADD CONSTRAINT "maintenance_components_maintenance_id_scheduled_maintenance_id_fk" FOREIGN KEY ("maintenance_id") REFERENCES "public"."scheduled_maintenance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_components" ADD CONSTRAINT "maintenance_components_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;