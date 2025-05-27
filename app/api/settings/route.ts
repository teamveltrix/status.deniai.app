import { NextRequest, NextResponse } from 'next/server';
import { createDb, settings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const db = createDb();

// GET all settings
export async function GET() {
  try {
    const allSettings = await db.select().from(settings);
    
    // Convert to key-value object for easier frontend usage
    const settingsObj = allSettings.reduce((acc, setting) => {
      let value: boolean | string | number = setting.value;
      
      // Parse value based on type
      if (setting.type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.type === 'number') {
        value = Number(setting.value);
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value);
        } catch {
          value = setting.value;
        }
      }
      
      acc[setting.key] = {
        value,
        type: setting.type,
        description: setting.description,
        updatedAt: setting.updatedAt,
      };
      
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

const settingsPostSchema = z.object({
  key: z.string().min(1, 'Key is required'),
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.object({}).catchall(z.any()), // For JSON objects
    ]).refine(val => val !== undefined, 'Value is required'),
    type: z.enum(['string', 'number', 'boolean', 'json']).optional().default('string'),
    description: z.string().optional(),
});

// POST or PUT setting values
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, type, description } = settingsPostSchema.parse(body);

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Convert value to string for storage
    let stringValue = value;
    if (type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (type === 'number') {
      stringValue = String(value);
    } else if (type === 'json') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    // Upsert setting
    const existingSetting = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    
    if (existingSetting.length > 0) {
      // Update existing setting
      await db
        .update(settings)
        .set({
          value: stringValue,
          type,
          description,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key));
    } else {
      // Insert new setting
      await db.insert(settings).values({
        key,
        value: stringValue,
        type,
        description,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}

const settingsPutSchema = z.object({
  settings: z.record(
    z.string().min(1, 'Key is required'),
    z.object({
      value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.object({}).catchall(z.any()), // For JSON objects
      ]).refine(val => val !== undefined, 'Value is required'),
      type: z.enum(['string', 'number', 'boolean', 'json']).optional().default('string'),
      description: z.string().optional(),
    })
  ),
});


// PUT multiple settings at once
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings: settingsToUpdate } = settingsPutSchema.parse(body);

    if (!settingsToUpdate || typeof settingsToUpdate !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Update all settings
    for (const [key, setting] of Object.entries(settingsToUpdate)) {
      const { value, type = 'string', description } = setting as any;
      
      // Convert value to string for storage
      let stringValue = value;
      if (type === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else if (type === 'number') {
        stringValue = String(value);
      } else if (type === 'json') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      // Upsert setting
      const existingSetting = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      
      if (existingSetting.length > 0) {
        // Update existing setting
        await db
          .update(settings)
          .set({
            value: stringValue,
            type,
            description,
            updatedAt: new Date(),
          })
          .where(eq(settings.key, key));
      } else {
        // Insert new setting
        await db.insert(settings).values({
          key,
          value: stringValue,
          type,
          description,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
