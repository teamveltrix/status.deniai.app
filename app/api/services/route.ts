import { NextRequest, NextResponse } from 'next/server';
import { createDb, services, components, type NewService } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-middleware';
import { z } from 'zod';
import { eq, asc } from 'drizzle-orm';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage']).default('operational'),
  url: z.string().url().optional().or(z.literal('')),
  order: z.number().default(0),
  isVisible: z.boolean().default(true),
});

export async function GET() {
  try {
    const db = createDb();
    
    // Get all services with their components
    const allServices = await db
      .select()
      .from(services)
      .orderBy(services.order, services.name);

    // Get components for each service
    const servicesWithComponents = await Promise.all(
      allServices.map(async (service) => {
        const serviceComponents = await db
          .select()
          .from(components)
          .where(eq(components.serviceId, service.id))
          .orderBy(asc(components.order), asc(components.name));

        return {
          ...service,
          components: serviceComponents.filter(c => c.isVisible),
        };
      })
    );

    return NextResponse.json(servicesWithComponents);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
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
    const validatedData = serviceSchema.parse(body);
    
    const newService: NewService = {
      ...validatedData,
      url: validatedData.url || null,
      description: validatedData.description || null,
    };
    
    const result = await db.insert(services).values(newService).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
