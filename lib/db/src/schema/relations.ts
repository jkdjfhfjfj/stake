import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { stakingPlansTable } from "./staking-plans";
import { stakesTable } from "./stakes";
import { transactionsTable } from "./transactions";
import { referralsTable } from "./referrals";
import { notificationsTable } from "./notifications";
import { auditLogsTable } from "./audit-logs";

export const usersRelations = relations(usersTable, ({ many }) => ({
  stakes: many(stakesTable),
  transactions: many(transactionsTable),
  notifications: many(notificationsTable),
  referralsMade: many(referralsTable, { relationName: "referrer" }),
  referralsReceived: many(referralsTable, { relationName: "referee" }),
}));

export const stakingPlansRelations = relations(stakingPlansTable, ({ many }) => ({
  stakes: many(stakesTable),
}));

export const stakesRelations = relations(stakesTable, ({ one }) => ({
  user: one(usersTable, { fields: [stakesTable.userId], references: [usersTable.id] }),
  plan: one(stakingPlansTable, { fields: [stakesTable.planId], references: [stakingPlansTable.id] }),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, { fields: [transactionsTable.userId], references: [usersTable.id] }),
}));

export const referralsRelations = relations(referralsTable, ({ one }) => ({
  referrer: one(usersTable, { fields: [referralsTable.referrerId], references: [usersTable.id], relationName: "referrer" }),
  referee: one(usersTable, { fields: [referralsTable.refereeId], references: [usersTable.id], relationName: "referee" }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, { fields: [notificationsTable.userId], references: [usersTable.id] }),
}));

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  admin: one(usersTable, { fields: [auditLogsTable.adminId], references: [usersTable.id], relationName: "adminUser" }),
  targetUser: one(usersTable, { fields: [auditLogsTable.targetUserId], references: [usersTable.id], relationName: "targetUser" }),
}));
