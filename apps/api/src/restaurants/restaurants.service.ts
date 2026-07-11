import { Injectable, NotFoundException } from "@nestjs/common";
import { db, restaurants, branches } from "@restaurante/database";
import { eq, and } from "drizzle-orm";

@Injectable()
export class RestaurantsService {
  async findById(id: string) {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id))
      .limit(1);

    if (!restaurant) {
      throw new NotFoundException("Restaurant not found.");
    }
    return restaurant;
  }

  async findBySlug(slug: string) {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      throw new NotFoundException("Restaurant not found.");
    }
    return restaurant;
  }

  async findBranchById(id: string) {
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    if (!branch) {
      throw new NotFoundException("Branch not found.");
    }
    return branch;
  }

  async listBranches(restaurantId: string) {
    return db
      .select()
      .from(branches)
      .where(and(eq(branches.restaurantId, restaurantId), eq(branches.isActive, true)));
  }
}
