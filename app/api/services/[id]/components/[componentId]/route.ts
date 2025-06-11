import { NextRequest, NextResponse } from 'next/server';
import { createDb, components } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

const componentUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']).optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id, componentId } = await params;
    const serviceId = parseInt(id);
    const compId = parseInt(componentId);

    if (isNaN(serviceId) || isNaN(compId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const db = createDb();
    const [component] = await db
      .select()
      .from(components)
      .where(eq(components.id, compId));

    if (!component || component.serviceId !== serviceId) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    return NextResponse.json(component);
  } catch (error) {
    console.error('Error fetching component:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id, componentId } = await params;
    const serviceId = parseInt(id);
    const compId = parseInt(componentId);

    if (isNaN(serviceId) || isNaN(compId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = componentUpdateSchema.parse(body);

    const db = createDb();
    
    // Check if component exists and belongs to the service
    const [existingComponent] = await db
      .select()
      .from(components)
      .where(eq(components.id, compId));

    if (!existingComponent || existingComponent.serviceId !== serviceId) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    const [updatedComponent] = await db
      .update(components)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(components.id, compId))
      .returning();

    return NextResponse.json(updatedComponent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating component:', error);
    return NextResponse.json(
      { error: 'Failed to update component' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id, componentId } = await params;
    const serviceId = parseInt(id);
    const compId = parseInt(componentId);

    if (isNaN(serviceId) || isNaN(compId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const db = createDb();
    
    // Check if component exists and belongs to the service
    const [existingComponent] = await db
      .select()
      .from(components)
      .where(eq(components.id, compId));

    if (!existingComponent || existingComponent.serviceId !== serviceId) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    await db
      .delete(components)
      .where(eq(components.id, compId));

    return NextResponse.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    return NextResponse.json(
      { error: 'Failed to delete component' },
      { status: 500 }
    );
  }
}
