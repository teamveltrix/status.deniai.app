import { NextRequest, NextResponse } from "next/server";
import { createDb, maintenanceUpdates, scheduledMaintenance } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import z from "zod";

const maintenanceUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = createDb();
    const { id } = await params;
    const maintenanceId = parseInt(id);
    const body = await request.json();
    const parsedBody = maintenanceUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { title, description, status } = parsedBody.data;

    // Validate required fields
    if (!title || !description || !status) {
      return NextResponse.json(
        { error: "Title, description, and status are required" },
        { status: 400 }
      );
    }

    // Check if maintenance exists
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

    // Create the update
    const [newUpdate] = await db
      .insert(maintenanceUpdates)
      .values({
        maintenanceId,
        title,
        description,
        status,
      })
      .returning();

    // Update the maintenance status to match the latest update
    await db
      .update(scheduledMaintenance)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === "in_progress" && !maintenance[0].actualStartTime
          ? { actualStartTime: new Date() }
          : {}),
        ...(status === "completed" ? { actualEndTime: new Date() } : {}),
      })
      .where(eq(scheduledMaintenance.id, maintenanceId));

    return NextResponse.json(newUpdate, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance update:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance update" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = createDb();
    const { id } = await params;
    const maintenanceId = parseInt(id);

    const updates = await db
      .select()
      .from(maintenanceUpdates)
      .where(eq(maintenanceUpdates.maintenanceId, maintenanceId))
      .orderBy(desc(maintenanceUpdates.createdAt));

    return NextResponse.json(updates);
  } catch (error) {
    console.error("Error fetching maintenance updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance updates" },
      { status: 500 }
    );
  }
}
