import { NextRequest, NextResponse } from 'next/server';
import { createDb, incidents, incidentServices, incidentUpdates, services } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';

const incidentUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
  impact: z.enum(['none', 'minor', 'major', 'critical']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = createDb();
    const { id } = await params;
    const incidentId = parseInt(id);
    if (isNaN(incidentId)) {
      return NextResponse.json({ error: 'Invalid incident ID' }, { status: 400 });
    }

    const incident = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    
    if (incident.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Get services affected by this incident
    const affectedServices = await db
      .select({
        service: services,
        impact: incidentServices.impact,
      })
      .from(incidentServices)
      .innerJoin(services, eq(incidentServices.serviceId, services.id))
      .where(eq(incidentServices.incidentId, incidentId));

    // Get all updates for this incident
    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, incidentId))
      .orderBy(desc(incidentUpdates.createdAt));

    return NextResponse.json({
      ...incident[0],
      services: affectedServices.map(item => ({
        ...item.service,
        impact: item.impact,
      })),
      updates,
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const incidentId = parseInt(id);
    if (isNaN(incidentId)) {
      return NextResponse.json({ error: 'Invalid incident ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = incidentUpdateSchema.parse(body);
    
    const updateData: any = { updatedAt: new Date() };
    
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.impact) updateData.impact = validatedData.impact;
    
    // If status is resolved, set resolvedAt
    if (validatedData.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    const result = await db
      .update(incidents)
      .set(updateData)
      .where(eq(incidents.id, incidentId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}
