import { NextRequest, NextResponse } from 'next/server';
import { createDb, services, incidents, incidentUpdates, scheduledMaintenance, maintenanceUpdates, settings, components } from '@/lib/db';
import { eq } from 'drizzle-orm';

const db = createDb();

// GET database status
export async function GET() {
  try {
    // Check database connection by running a simple query
    await db.select().from(settings).limit(1);
      // Get basic statistics
    const [servicesCount] = await db.select({ count: services.id }).from(services);
    const [incidentsCount] = await db.select({ count: incidents.id }).from(incidents);
    const [maintenanceCount] = await db.select({ count: scheduledMaintenance.id }).from(scheduledMaintenance);
    const [componentsCount] = await db.select({ count: components.id }).from(components);
    
    return NextResponse.json({
      status: 'connected',
      database: 'PostgreSQL',
      statistics: {
        services: servicesCount?.count || 0,
        incidents: incidentsCount?.count || 0,
        maintenance: maintenanceCount?.count || 0,
        components: componentsCount?.count || 0,
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        status: 'disconnected',
        error: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}

// POST database operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action: string; data?: any };
    const { action } = body;

    switch (action) {
      case 'export':
        return await exportData();
      case 'import':
        return await importData(body.data);
      case 'reset':
        return await resetAllData();
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json(
      { error: 'Database operation failed' },
      { status: 500 }
    );
  }
}

async function exportData() {
  try {    const [
      allServices,
      allIncidents,
      allIncidentUpdates,
      allMaintenance,
      allMaintenanceUpdates,
      allSettings,
      allComponents,
    ] = await Promise.all([
      db.select().from(services),
      db.select().from(incidents),
      db.select().from(incidentUpdates),
      db.select().from(scheduledMaintenance),
      db.select().from(maintenanceUpdates),
      db.select().from(settings),
      db.select().from(components),
    ]);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        services: allServices,
        incidents: allIncidents,
        incidentUpdates: allIncidentUpdates,
        maintenance: allMaintenance,
        maintenanceUpdates: allMaintenanceUpdates,
        settings: allSettings,
        components: allComponents,
      }
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="status-page-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function importData(importData: any) {
  try {
    if (!importData || !importData.data) {
      return NextResponse.json(
        { error: 'Invalid import data format' },
        { status: 400 }
      );
    }

    const { data } = importData;    // Import in the correct order to maintain referential integrity
    if (data.settings) {
      for (const setting of data.settings) {
        try {
          await db.insert(settings).values(setting);
        } catch (error) {
          // Skip if already exists
          console.log('Setting already exists, skipping:', setting.key);
        }
      }
    }

    if (data.services) {
      for (const service of data.services) {
        try {
          await db.insert(services).values(service);
        } catch (error) {
          // Skip if already exists
          console.log('Service already exists, skipping:', service.name);
        }
      }
    }

    if (data.incidents) {
      for (const incident of data.incidents) {
        try {
          await db.insert(incidents).values(incident);
        } catch (error) {
          // Skip if already exists
          console.log('Incident already exists, skipping:', incident.title);
        }
      }
    }

    if (data.incidentUpdates) {
      for (const update of data.incidentUpdates) {
        try {
          await db.insert(incidentUpdates).values(update);
        } catch (error) {
          // Skip if already exists
          console.log('Incident update already exists, skipping');
        }
      }
    }

    if (data.maintenance) {
      for (const maintenance of data.maintenance) {
        try {
          await db.insert(scheduledMaintenance).values(maintenance);
        } catch (error) {
          // Skip if already exists
          console.log('Maintenance already exists, skipping:', maintenance.title);
        }
      }
    }    if (data.maintenanceUpdates) {
      for (const update of data.maintenanceUpdates) {
        try {
          await db.insert(maintenanceUpdates).values(update);
        } catch (error) {
          // Skip if already exists
          console.log('Maintenance update already exists, skipping');
        }
      }
    }

    if (data.components) {
      for (const component of data.components) {
        try {
          await db.insert(components).values(component);
        } catch (error) {
          // Skip if already exists
          console.log('Component already exists, skipping:', component.name);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Data imported successfully' });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}

async function resetAllData() {
  try {
    // Delete all data in the correct order to maintain referential integrity
    await db.delete(incidentUpdates);
    await db.delete(maintenanceUpdates);
    await db.delete(components);
    await db.delete(incidents);
    await db.delete(scheduledMaintenance);
    await db.delete(services);
    await db.delete(settings);

    return NextResponse.json({ success: true, message: 'All data has been reset' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset data' },
      { status: 500 }
    );
  }
}
