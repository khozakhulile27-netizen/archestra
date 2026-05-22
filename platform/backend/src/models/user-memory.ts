import { and, eq, isNull, or } from "drizzle-orm";
import db, { schema } from "@/database";
import type { InsertUserMemory, UpdateUserMemory, UserMemory } from "@/types";

class UserMemoryModel {
  /**
   * Fetch all active memories for a user in an org.
   *
   * Returns global memories (agentId IS NULL) plus any memories scoped to
   * the given agentId. Called during prompt construction — single indexed
   * query with no joins.
   */
  static async findActiveForUser(params: {
    userId: string;
    organizationId: string;
    agentId?: string | null;
  }): Promise<UserMemory[]> {
    const { userId, organizationId, agentId } = params;

    const agentCondition = agentId
      ? or(
          isNull(schema.userMemoriesTable.agentId),
          eq(schema.userMemoriesTable.agentId, agentId),
        )
      : isNull(schema.userMemoriesTable.agentId);

    return db
      .select()
      .from(schema.userMemoriesTable)
      .where(
        and(
          eq(schema.userMemoriesTable.userId, userId),
          eq(schema.userMemoriesTable.organizationId, organizationId),
          eq(schema.userMemoriesTable.active, "true"),
          agentCondition,
        ),
      )
      .orderBy(schema.userMemoriesTable.createdAt);
  }

  static async create(data: InsertUserMemory): Promise<UserMemory> {
    const [memory] = await db
      .insert(schema.userMemoriesTable)
      .values(data)
      .returning();
    return memory;
  }

  static async bulkCreate(data: InsertUserMemory[]): Promise<UserMemory[]> {
    if (data.length === 0) return [];
    return db
      .insert(schema.userMemoriesTable)
      .values(data)
      .returning();
  }

  static async update(
    id: string,
    userId: string,
    data: UpdateUserMemory,
  ): Promise<UserMemory | null> {
    const [updated] = await db
      .update(schema.userMemoriesTable)
      .set(data)
      .where(
        and(
          eq(schema.userMemoriesTable.id, id),
          eq(schema.userMemoriesTable.userId, userId),
        ),
      )
      .returning();
    return updated ?? null;
  }

  static async deactivate(id: string, userId: string): Promise<void> {
    await db
      .update(schema.userMemoriesTable)
      .set({ active: "false" })
      .where(
        and(
          eq(schema.userMemoriesTable.id, id),
          eq(schema.userMemoriesTable.userId, userId),
        ),
      );
  }

  static async deleteAllForUser(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    await db
      .delete(schema.userMemoriesTable)
      .where(
        and(
          eq(schema.userMemoriesTable.userId, userId),
          eq(schema.userMemoriesTable.organizationId, organizationId),
        ),
      );
  }
}

export default UserMemoryModel;
