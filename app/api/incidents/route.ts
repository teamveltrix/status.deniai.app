import { NextRequest, NextResponse } from 'next/server';
import { createDb, incidents, incidentServices, incidentUpdates, services, type NewIncident, type NewIncidentService } from '@/lib/db';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth-middleware';

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  impact: z.enum(['none', 'minor', 'major', 'critical']).default('minor'),
  serviceIds: z.array(z.number()).optional(),
});

export async function GET() {
  try {
    const db = createDb();
    const allIncidents = await db
      .select({
        id: incidents.id,
        title: incidents.title,
        description: incidents.description,
        status: incidents.status,
        impact: incidents.impact,
        createdAt: incidents.createdAt,
        updatedAt: incidents.updatedAt,
        resolvedAt: incidents.resolvedAt,
      })
      .from(incidents)
      .orderBy(desc(incidents.createdAt));

    // Get services for each incident
    const incidentsWithServices = await Promise.all(
      allIncidents.map(async (incident) => {
        const incidentServicesList = await db
          .select({
            service: services,
            impact: incidentServices.impact,
          })
          .from(incidentServices)
          .innerJoin(services, eq(incidentServices.serviceId, services.id))
          .where(eq(incidentServices.incidentId, incident.id));

        // Get latest update
        const latestUpdate = await db
          .select()
          .from(incidentUpdates)
          .where(eq(incidentUpdates.incidentId, incident.id))
          .orderBy(desc(incidentUpdates.createdAt))
          .limit(1);

        return {
          ...incident,
          services: incidentServicesList.map(item => ({
            ...item.service,
            impact: item.impact,
          })),
          latestUpdate: latestUpdate[0] || null,
        };
      })
    );

    return NextResponse.json(incidentsWithServices);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  try {
    const db = createDb();
    const body = await request.json();
    const validatedData = incidentSchema.parse(body);
    
    const newIncident: NewIncident = {
      title: validatedData.title,
      description: validatedData.description || null,
      impact: validatedData.impact,
    };
    
    const result = await db.insert(incidents).values(newIncident).returning();
    const createdIncident = result[0];

    // Add services to incident if provided
    if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
      const incidentServiceData: NewIncidentService[] = validatedData.serviceIds.map(serviceId => ({
        incidentId: createdIncident.id,
        serviceId,
        impact: validatedData.impact,
      }));

      await db.insert(incidentServices).values(incidentServiceData);
    }

    // Create initial update
    await db.insert(incidentUpdates).values({
      incidentId: createdIncident.id,
      title: 'Incident Created',
      description: validatedData.description || 'We are investigating this incident.',
      status: 'investigating',
    });

    return NextResponse.json(createdIncident, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}
