import { NextRequest, NextResponse } from 'next/server';
import { createDb, incidentUpdates, incidents, type NewIncidentUpdate } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';

const incidentUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
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

    // Verify incident exists
    const incident = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    if (incident.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Get all updates for this incident
    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, incidentId))
      .orderBy(desc(incidentUpdates.createdAt));

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error fetching incident updates:', error);
    return NextResponse.json({ error: 'Failed to fetch incident updates' }, { status: 500 });
  }
}

export async function POST(
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

    // Verify incident exists
    const incident = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    if (incident.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = incidentUpdateSchema.parse(body);
    
    const newUpdate: NewIncidentUpdate = {
      incidentId,
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
    };
    
    const result = await db.insert(incidentUpdates).values(newUpdate).returning();
    
    // Update the incident status and timestamp
    const updateData: any = {
      status: validatedData.status,
      updatedAt: new Date(),
    };
    
    // If status is resolved, set resolvedAt
    if (validatedData.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    await db.update(incidents).set(updateData).where(eq(incidents.id, incidentId));
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating incident update:', error);
    return NextResponse.json({ error: 'Failed to create incident update' }, { status: 500 });
  }
}
