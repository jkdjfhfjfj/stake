import { pgTable, serial, integer, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { stakingPlansTable } from "./staking-plans";

export const stakeStatusEnum = pgEnum("stake_status", ["ACTIVE", "COMPLETED", "BROKEN"]);

export const stakesTable = pgTable("stakes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  planId: integer("plan_id").notNull().references(() => stakingPlansTable.id),
  principalAmount: numeric("principal_amount", { precision: 15, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 15, scale: 2 }).notNull(),
  accruedInterest: numeric("accrued_interest", { precision: 15, scale: 2 }).notNull().default("0"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  status: stakeStatusEnum("status").notNull().default("ACTIVE"),
  autoInvest: boolean("auto_invest").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStakeSchema = createInsertSchema(stakesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStake = z.infer<typeof insertStakeSchema>;
export type Stake = typeof stakesTable.$inferSelect;
