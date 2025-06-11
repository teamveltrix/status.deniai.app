import { NextRequest, NextResponse } from 'next/server';
import { createDb, components, type NewComponent } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

const componentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']).default('operational'),
  order: z.number().default(0),
  isVisible: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    const db = createDb();
    const serviceComponents = await db
      .select()
      .from(components)
      .where(eq(components.serviceId, serviceId))
      .orderBy(asc(components.order), asc(components.name));

    return NextResponse.json(serviceComponents);
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = componentSchema.parse(body);

    const db = createDb();
    const newComponent: NewComponent = {
      ...validatedData,
      serviceId,
    };

    const [createdComponent] = await db
      .insert(components)
      .values(newComponent)
      .returning();

    return NextResponse.json(createdComponent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating component:', error);
    return NextResponse.json(
      { error: 'Failed to create component' },
      { status: 500 }
    );
  }
}
