import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { schema } from "@/database";

export const SelectUserMemorySchema = createSelectSchema(
  schema.userMemoriesTable,
);
export const InsertUserMemorySchema = createInsertSchema(
  schema.userMemoriesTable,
);
export const UpdateUserMemorySchema = createUpdateSchema(
  schema.userMemoriesTable,
);

export type UserMemory = z.infer<typeof SelectUserMemorySchema>;
export type InsertUserMemory = z.infer<typeof InsertUserMemorySchema>;
export type UpdateUserMemory = z.infer<typeof UpdateUserMemorySchema>;
