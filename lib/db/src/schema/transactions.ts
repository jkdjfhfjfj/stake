import { pgTable, serial, integer, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "DEPOSIT", "WITHDRAWAL", "STAKE", "UNSTAKE", "INTEREST", "REFERRAL_REWARD", "MANUAL_CREDIT", "MANUAL_DEBIT"
]);

export const transactionStatusEnum = pgEnum("transaction_status", ["PENDING", "COMPLETED", "FAILED", "REJECTED"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").notNull().default("PENDING"),
  description: text("description").notNull(),
  externalReference: text("external_reference"),
  payheroRef: text("payhero_ref"),
  phoneNumber: text("phone_number"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
