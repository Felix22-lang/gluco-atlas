import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const workspaceEntries = sqliteTable(
  "workspace_entries",
  {
    owner: text("owner").notNull(),
    kind: text("kind").notNull(),
    entryKey: text("entry_key").notNull(),
    revision: integer("revision").notNull(),
    payload: text("payload").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.owner, table.kind, table.entryKey] }),
  ],
);
