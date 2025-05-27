import { NextRequest, NextResponse } from "next/server";
import {
  createDb,
  scheduledMaintenance,
  maintenanceServices,
  maintenanceUpdates,
  services,
} from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = createDb();
    const { id } = await params;
    const maintenanceId = parseInt(id);

    // Get maintenance details
    const maintenance = await db
      .select()
      .from(scheduledMaintenance)
      .where(eq(scheduledMaintenance.id, maintenanceId))
      .limit(1);

    if (maintenance.length === 0) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    // Get affected services
    const affectedServices = await db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        status: services.status,
        url: services.url,
        impact: maintenanceServices.impact,
      })
      .from(maintenanceServices)
      .innerJoin(services, eq(maintenanceServices.serviceId, services.id))
      .where(eq(maintenanceServices.maintenanceId, maintenanceId));

    // Get all updates
    const updates = await db
      .select()
      .from(maintenanceUpdates)
      .where(eq(maintenanceUpdates.maintenanceId, maintenanceId))
      .orderBy(desc(maintenanceUpdates.createdAt));

    const result = {
      ...maintenance[0],
      services: affectedServices,
      updates,
      latestUpdate: updates[0] || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance" },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = createDb();
    const { id } = await params;
    const maintenanceId = parseInt(id);
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      status?: "scheduled" | "in_progress" | "completed" | "cancelled";
      impact?: "none" | "minor" | "major" | "critical";
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      actualStartTime?: string;
      actualEndTime?: string;
    };

    const {
      title,
      description,
      status,
      impact,
      scheduledStartTime,
      scheduledEndTime,
      actualStartTime,
      actualEndTime,
    } = body;

    const updateData: any = { updatedAt: new Date() };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (impact) updateData.impact = impact;
    if (scheduledStartTime)
      updateData.scheduledStartTime = new Date(scheduledStartTime);
    if (scheduledEndTime)
      updateData.scheduledEndTime = new Date(scheduledEndTime);
    if (actualStartTime) updateData.actualStartTime = new Date(actualStartTime);
    if (actualEndTime) updateData.actualEndTime = new Date(actualEndTime);

    const [updatedMaintenance] = await db
      .update(scheduledMaintenance)
      .set(updateData)
      .where(eq(scheduledMaintenance.id, maintenanceId))
      .returning();

    if (!updatedMaintenance) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMaintenance);
  } catch (error) {
    console.error("Error updating maintenance:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = createDb();
    const { id } = await params;
    const maintenanceId = parseInt(id);

    const deletedMaintenance = await db
      .delete(scheduledMaintenance)
      .where(eq(scheduledMaintenance.id, maintenanceId))
      .returning();

    if (deletedMaintenance.length === 0) {
      return NextResponse.json(
        { error: "Maintenance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Maintenance deleted successfully" });
  } catch (error) {
    console.error("Error deleting maintenance:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance" },
      { status: 500 }
    );
  }
}
