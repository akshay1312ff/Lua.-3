import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accessKeysTable = pgTable("access_keys", {
  id: serial("id").primaryKey(),
  keyValue: text("key_value").notNull().unique(),
  note: text("note").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serverConfigTable = pgTable("server_config", {
  id: serial("id").primaryKey(),
  luaScript: text("lua_script").notNull().default(""),
  alertMessage: text("alert_message").notNull().default("Akshu Mod Server Active!"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAccessKeySchema = createInsertSchema(accessKeysTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAccessKey = z.infer<typeof insertAccessKeySchema>;
export type AccessKey = typeof accessKeysTable.$inferSelect;
export type ServerConfig = typeof serverConfigTable.$inferSelect;
