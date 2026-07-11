import { Injectable, NotFoundException, BadRequestException, Inject, UnauthorizedException } from "@nestjs/common";
import { users, userRoleAssignments, roles } from "@restaurante/database";
import { verifyPassword } from "../security/passwords.js";
import { AuditService } from "../audit/audit.service.js";
import { db, categories, products } from "@restaurante/database";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  isActive: z.boolean().default(true),
  type: z.string().default("product")
});

export const updateCategorySchema = createCategorySchema.partial();

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1),
  sku: z.string().optional(),
  unitAmountInCents: z.number().int().nonnegative(),
  isActive: z.boolean().default(true)
});

export const updateProductSchema = createProductSchema.partial();

@Injectable()
export class ProductsService {
  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) {}
  async createCategory(restaurantId: string, input: unknown) {
    const parsed = createCategorySchema.parse(input);
    const [category] = await db
      .insert(categories)
      .values({
        restaurantId,
        name: parsed.name,
        slug: parsed.slug,
        isActive: parsed.isActive,
        type: parsed.type
      })
      .returning();
    return category;
  }

  async updateCategory(restaurantId: string, id: string, input: unknown) {
    const parsed = updateCategorySchema.parse(input);
    const [category] = await db
      .update(categories)
      .set({
        ...parsed,
        updatedAt: new Date()
      })
      .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)))
      .returning();

    if (!category) {
      throw new NotFoundException("Category not found.");
    }
    return category;
  }

  async listCategories(restaurantId: string, onlyActive = true, type?: string) {
    const conditions = [eq(categories.restaurantId, restaurantId)];
    if (onlyActive) {
      conditions.push(eq(categories.isActive, true));
    }
    if (type) {
      conditions.push(eq(categories.type, type));
    }
    return db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.name));
  }

  async findCategoryById(restaurantId: string, id: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)))
      .limit(1);

    if (!category) {
      throw new NotFoundException("Category not found.");
    }
    return category;
  }

  async createProduct(restaurantId: string, input: unknown) {
    const parsed = createProductSchema.parse(input);
    // Verify category exists
    await this.findCategoryById(restaurantId, parsed.categoryId);

    const [product] = await db
      .insert(products)
      .values({
        restaurantId,
        categoryId: parsed.categoryId,
        name: parsed.name,
        description: parsed.description ?? null,
        slug: parsed.slug,
        sku: parsed.sku ?? null,
        unitAmountInCents: parsed.unitAmountInCents,
        isActive: parsed.isActive
      })
      .returning();
    return product;
  }

  async updateProduct(restaurantId: string, id: string, input: unknown) {
    const parsed = updateProductSchema.parse(input);

    if (parsed.categoryId) {
      await this.findCategoryById(restaurantId, parsed.categoryId);
    }

    const [product] = await db
      .update(products)
      .set({
        ...parsed,
        updatedAt: new Date()
      })
      .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)))
      .returning();

    if (!product) {
      throw new NotFoundException("Product not found.");
    }
    return product;
  }

  async deleteCategory(restaurantId: string, actorUserId: string, id: string, adminPassword?: string) {
    if (!adminPassword) {
      throw new BadRequestException("A senha do administrador é obrigatória.");
    }

    // Verify admin password
    const admins = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash
      })
      .from(users)
      .innerJoin(userRoleAssignments, eq(users.id, userRoleAssignments.userId))
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(
        and(
          eq(users.restaurantId, restaurantId),
          eq(roles.name, "Administrador")
        )
      );

    let isValid = false;
    for (const admin of admins) {
      if (admin.passwordHash && (await verifyPassword(adminPassword, admin.passwordHash))) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      throw new UnauthorizedException("Senha de administrador incorreta.");
    }

    // Check if there are products linked to this category
    const linkedProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.categoryId, id), eq(products.restaurantId, restaurantId)));

    if (linkedProducts.length > 0) {
      throw new BadRequestException(
        "Não é possível excluir esta categoria porque há produtos vinculados a ela."
      );
    }

    // Get name for audit description
    const category = await this.findCategoryById(restaurantId, id);

    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException("Category not found.");
    }

    // Log to audit log
    await this.auditService.log({
      restaurantId,
      userId: actorUserId,
      action: "delete_category",
      description: `Excluiu a categoria "${category.name}" (ID: ${id}) fisicamente.`
    });

    return { success: true };
  }

  async deleteProduct(restaurantId: string, actorUserId: string, id: string, adminPassword?: string) {
    if (!adminPassword) {
      throw new BadRequestException("A senha do administrador é obrigatória.");
    }

    // Verify admin password
    const admins = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash
      })
      .from(users)
      .innerJoin(userRoleAssignments, eq(users.id, userRoleAssignments.userId))
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(
        and(
          eq(users.restaurantId, restaurantId),
          eq(roles.name, "Administrador")
        )
      );

    let isValid = false;
    for (const admin of admins) {
      if (admin.passwordHash && (await verifyPassword(adminPassword, admin.passwordHash))) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      throw new UnauthorizedException("Senha de administrador incorreta.");
    }

    // Fetch product name for description
    const product = await this.findProductById(restaurantId, id);

    // Delete product physically
    const [deleted] = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException("Product not found.");
    }

    // Log this deletion to the audit log
    await this.auditService.log({
      restaurantId,
      userId: actorUserId,
      action: "delete_product",
      description: `Excluiu o produto "${product.name}" (ID: ${id}) fisicamente.`
    });

    return { success: true };
  }

  async listProducts(restaurantId: string, categoryId?: string, onlyActive = true) {
    const conditions = [eq(products.restaurantId, restaurantId)];
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (onlyActive) {
      conditions.push(eq(products.isActive, true));
    }
    return db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name));
  }

  async findProductById(restaurantId: string, id: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)))
      .limit(1);

    if (!product) {
      throw new NotFoundException("Product not found.");
    }
    return product;
  }
}

