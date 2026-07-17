import { pgTable, serial, text, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stakingPlansTable = pgTable("staking_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  roiPercent: numeric("roi_percent", { precision: 8, scale: 4 }).notNull(),
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }).notNull(),
  earlyWithdrawalPenalty: numeric("early_withdrawal_penalty", { precision: 8, scale: 4 }).notNull().default("10"),
  lockPeriodDays: integer("lock_period_days").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStakingPlanSchema = createInsertSchema(stakingPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStakingPlan = z.infer<typeof insertStakingPlanSchema>;
export type StakingPlan = typeof stakingPlansTable.$inferSelect;
