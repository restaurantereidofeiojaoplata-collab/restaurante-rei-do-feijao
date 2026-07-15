import { Injectable } from "@nestjs/common";
import { db, settings } from "@restaurante/database";
import { eq } from "drizzle-orm";

@Injectable()
export class SettingsService {
  async getSettings(restaurantId: string): Promise<Record<string, string>> {
    const list = await db
      .select()
      .from(settings)
      .where(eq(settings.restaurantId, restaurantId));

    // Convert list to key-value object
    const result: Record<string, string> = {};
    for (const item of list) {
      result[item.key] = item.value;
    }
    return result;
  }

  async saveSettings(restaurantId: string, payload: Record<string, string>): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(payload)) {
      if (typeof key !== 'string' || typeof value !== 'string') continue;
      
      // Upsert using insert ... onConflictDoUpdate
      await db
        .insert(settings)
        .values({
          restaurantId,
          key: key.trim(),
          value: value.trim()
        })
        .onConflictDoUpdate({
          target: [settings.restaurantId, settings.key],
          set: {
            value: value.trim(),
            updatedAt: new Date()
          }
        });
    }

    return this.getSettings(restaurantId);
  }
}
