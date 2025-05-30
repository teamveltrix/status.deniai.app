import { NextRequest, NextResponse } from "next/server";
import {
  createDb,
  scheduledMaintenance,
  maintenanceServices,
  maintenanceUpdates,
  services,
} from "@/lib/db";
import { eq, desc, and, gte, sql, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const db = createDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");

    console.log(
      "メンテナンスAPI呼び出し - upcoming:",
      upcoming,
      "status:",
      status
    );

    let whereConditions = [];

    if (status) {
      whereConditions.push(
        eq(
          scheduledMaintenance.status,
          status as "scheduled" | "in_progress" | "completed" | "cancelled"
        )
      );
    }    if (upcoming === "true") {
      const now = new Date();
      console.log("現在時刻:", now);
      console.log("ISO文字列:", now.toISOString());
      
      // Use proper Drizzle ORM operators for timestamp comparison
      whereConditions.push(
        or(
          gte(scheduledMaintenance.scheduledStartTime, now),
          eq(scheduledMaintenance.status, 'in_progress')
        )
      );
    }

    let query: any = db
      .select({
        id: scheduledMaintenance.id,
        title: scheduledMaintenance.title,
        description: scheduledMaintenance.description,
        status: scheduledMaintenance.status,
        impact: scheduledMaintenance.impact,
        scheduledStartTime: scheduledMaintenance.scheduledStartTime,
        scheduledEndTime: scheduledMaintenance.scheduledEndTime,
        actualStartTime: scheduledMaintenance.actualStartTime,
        actualEndTime: scheduledMaintenance.actualEndTime,
        createdAt: scheduledMaintenance.createdAt,
        updatedAt: scheduledMaintenance.updatedAt,
      })
      .from(scheduledMaintenance);

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    const maintenances = await query.orderBy(
      desc(scheduledMaintenance.scheduledStartTime)
    );

    console.log("取得したメンテナンス数:", maintenances.length);
    console.log("メンテナンスレコード:", maintenances);

    // Get services and latest updates for each maintenance
    const maintenancesWithDetails = await Promise.all(
      maintenances.map(async (maintenance: any) => {
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
          .where(eq(maintenanceServices.maintenanceId, maintenance.id));

        // Get latest update
        const latestUpdate = await db
          .select()
          .from(maintenanceUpdates)
          .where(eq(maintenanceUpdates.maintenanceId, maintenance.id))
          .orderBy(desc(maintenanceUpdates.createdAt))
          .limit(1);

        return {
          ...maintenance,
          services: affectedServices,
          latestUpdate: latestUpdate[0] || null,
        };
      })
    );

    return NextResponse.json(maintenancesWithDetails);
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = createDb();
    const body = (await request.json()) as {
      title: string;
      description?: string;
      impact?: "none" | "minor" | "major" | "critical";
      scheduledStartTime: string;
      scheduledEndTime: string;
      serviceIds?: number[];
    };

    const {
      title,
      description,
      impact,
      scheduledStartTime,
      scheduledEndTime,
      serviceIds,
    } = body;

    // Validate required fields
    if (!title || !scheduledStartTime || !scheduledEndTime) {
      return NextResponse.json(
        {
          error:
            "Title, scheduled start time, and scheduled end time are required",
        },
        { status: 400 }
      );
    }

    // Create the maintenance
    const [newMaintenance] = await db
      .insert(scheduledMaintenance)
      .values({
        title,
        description,
        impact: impact || "minor",
        scheduledStartTime: new Date(scheduledStartTime),
        scheduledEndTime: new Date(scheduledEndTime),
      })
      .returning();

    // Link services if provided
    if (serviceIds && serviceIds.length > 0) {
      await db.insert(maintenanceServices).values(
        serviceIds.map((serviceId: number) => ({
          maintenanceId: newMaintenance.id,
          serviceId,
          impact: impact || "minor",
        }))
      );
    }

    // Create initial update
    await db.insert(maintenanceUpdates).values({
      maintenanceId: newMaintenance.id,
      title: "Maintenance Scheduled",
      description: description || `Scheduled maintenance: ${title}`,
      status: "scheduled",
    });

    return NextResponse.json(newMaintenance, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance" },
      { status: 500 }
    );
  }
}
