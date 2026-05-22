import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import usersTable from "./user";

/**
 * Durable per-user memory facts for cross-conversation persistence.
 *
 * Each row is one discrete fact about a user (preference, working style,
 * project context, corrected information, etc.) that is injected into
 * future system prompts so agents retain what they have learned.
 *
 * Scoped to (userId, organizationId) to match the access-control boundary
 * used everywhere else in the platform.
 *
 * agentId is nullable: null = applies to all agents in the org,
 * non-null = applies only when chatting with that specific agent.
 */
const userMemoriesTable = pgTable(
  "user_memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** The user this memory belongs to. Cascades on user deletion. */
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    /** Org-isolation boundary — matches conversations.organization_id */
    organizationId: text("organization_id").notNull(),

    /**
     * Optional agent scope. null = global (all agents in org).
     * When set, memory only injects for that specific agent.
     * No FK so memories survive agent deletion.
     */
    agentId: uuid("agent_id"),

    /**
     * The conversation this memory was extracted from.
     * Kept for auditability; no FK so memories survive conversation deletion.
     */
    sourceConversationId: uuid("source_conversation_id"),

    /**
     * Short category tag for grouping and prompt formatting.
     * Examples: 'preference', 'project_context', 'correction', 'working_style'
     */
    category: varchar("category", { length: 64 }).notNull().default("general"),

    /**
     * The memory content — a single self-contained declarative fact written
     * in third-person so it reads naturally inside a system prompt.
     * e.g. "The user prefers concise bullet-point responses over long prose."
     */
    content: text("content").notNull(),

    /**
     * Soft-delete flag. Allows the user or system to deactivate a stale
     * memory without losing the audit trail.
     */
    active: varchar("active", { length: 8 }).notNull().default("true"),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("user_memories_user_org_idx").on(table.userId, table.organizationId),
    index("user_memories_agent_id_idx").on(table.agentId),
    index("user_memories_source_conversation_idx").on(
      table.sourceConversationId,
    ),
  ],
);

export default userMemoriesTable;
