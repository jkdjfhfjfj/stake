import { Router } from "express";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import {
  db, usersTable, stakesTable, transactionsTable,
  auditLogsTable, platformSettingsTable, notificationsTable, referralsTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
// disburseB2C removed — withdrawals are manually processed
import { createNotification } from "../lib/notifications";
import { nanoid } from "nanoid";
import {
  AdminListUsersResponse,
  AdminUpdateUserParams,
  AdminUpdateUserBody,
  AdminUpdateUserResponse,
  GetAdminAnalyticsResponse,
  AdminListWithdrawalsResponse,
  DisburseWithdrawalParams,
  DisburseWithdrawalResponse,
  RejectWithdrawalParams,
  RejectWithdrawalBody,
  RejectWithdrawalResponse,
  ListAuditLogsResponse,
  GetAdminSettingsResponse,
  UpdateAdminSettingsBody,
  UpdateAdminSettingsResponse,
  ProcessMaturedStakesResponse,
} from "@workspace/api-zod";

const router = Router();

// ── Staking Plans (Admin — all including inactive) ─────────────────────────
router.get("/admin/staking-plans", requireAdmin, async (_req, res): Promise<void> => {
  const { stakingPlansTable } = await import("@workspace/db");
  const plans = await db.select().from(stakingPlansTable).orderBy(stakingPlansTable.id);
  res.json(plans.map((p) => ({
    ...p,
    roiPercent: Number(p.roiPercent),
    minAmount: Number(p.minAmount),
    maxAmount: Number(p.maxAmount),
    earlyWithdrawalPenalty: Number(p.earlyWithdrawalPenalty),
  })));
});

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.query.usersTable.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const stakeCountsRaw = await db.select({ userId: stakesTable.userId, count: sql<number>`count(*)` })
    .from(stakesTable)
    .where(eq(stakesTable.status, "ACTIVE"))
    .groupBy(stakesTable.userId);
  const stakeMap = Object.fromEntries(stakeCountsRaw.map((s) => [s.userId, Number(s.count)]));

  res.json(AdminListUsersResponse.parse(users.map((u) => ({
    ...u,
    availableBalance: Number(u.availableBalance),
    totalEarnings: Number(u.totalEarnings),
    referralRewards: Number(u.referralRewards),
    activeStakesCount: stakeMap[u.id] ?? 0,
  }))));
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const target = await db.query.usersTable.findFirst({ where: eq(usersTable.id, params.data.id) });
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.isLocked !== undefined) updates.isLocked = parsed.data.isLocked;

  if (parsed.data.balanceAdjustment !== undefined && parsed.data.balanceAdjustment !== 0) {
    const newBalance = Number(target.availableBalance) + parsed.data.balanceAdjustment;
    updates.availableBalance = newBalance.toFixed(2);

    const isCredit = parsed.data.balanceAdjustment > 0;
    await db.insert(transactionsTable).values({
      userId: target.id,
      type: isCredit ? "MANUAL_CREDIT" : "MANUAL_DEBIT",
      amount: Math.abs(parsed.data.balanceAdjustment).toFixed(2),
      status: "COMPLETED",
      description: parsed.data.adjustmentNote ?? `Admin ${isCredit ? "credit" : "debit"}`,
    });
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning();

  // Audit log
  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Updated user #${params.data.id}: ${JSON.stringify(parsed.data)}`,
    targetUserId: params.data.id,
    note: parsed.data.adjustmentNote ?? null,
  });

  res.json(AdminUpdateUserResponse.parse({
    ...updated,
    availableBalance: Number(updated.availableBalance),
    totalEarnings: Number(updated.totalEarnings),
    referralRewards: Number(updated.referralRewards),
    activeStakesCount: 0,
  }));
});

// ── Admin: Full profile edit ───────────────────────────────────────────────
router.put("/admin/users/:id/profile", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid user id" }); return; }

  const target = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  const { fullName, email, mpesaNumber, location, referralCode, onboardingComplete, createdAt } = req.body as {
    fullName?: string; email?: string; mpesaNumber?: string; location?: string;
    referralCode?: string; onboardingComplete?: boolean; createdAt?: string;
  };

  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (fullName !== undefined) updates.fullName = fullName || null;
  if (mpesaNumber !== undefined) updates.mpesaNumber = mpesaNumber || null;
  if (location !== undefined) updates.location = location || null;
  if (onboardingComplete !== undefined) updates.onboardingComplete = Boolean(onboardingComplete);

  if (email && email.toLowerCase() !== target.email) {
    const exists = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
    if (exists) { res.status(409).json({ error: "Email already in use" }); return; }
    updates.email = email.toLowerCase();
  }

  if (referralCode && referralCode.toUpperCase() !== target.referralCode) {
    const exists = await db.query.usersTable.findFirst({ where: eq(usersTable.referralCode, referralCode.toUpperCase()) });
    if (exists) { res.status(409).json({ error: "Referral code already in use" }); return; }
    updates.referralCode = referralCode.toUpperCase();
  }

  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) updates.createdAt = d;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Admin profile edit user #${id}: ${JSON.stringify(updates)}`,
    targetUserId: id,
  });

  res.json({
    ...updated,
    availableBalance: Number(updated.availableBalance),
    totalEarnings: Number(updated.totalEarnings),
    referralRewards: Number(updated.referralRewards),
  });
});

// ── Admin: Create transaction for user ─────────────────────────────────────
router.post("/admin/users/:id/transaction", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid user id" }); return; }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { type, amount, description, status = "COMPLETED" } = req.body as {
    type: string; amount: number; description?: string; status?: string;
  };

  const VALID_TYPES = ["DEPOSIT", "WITHDRAWAL", "INTEREST", "MANUAL_CREDIT", "MANUAL_DEBIT", "STAKE", "UNSTAKE", "REFERRAL_REWARD"];
  if (!VALID_TYPES.includes(type)) { res.status(400).json({ error: "Invalid transaction type" }); return; }
  if (!amount || amount <= 0) { res.status(400).json({ error: "Amount must be positive" }); return; }

  const CREDIT_TYPES = new Set(["DEPOSIT", "INTEREST", "MANUAL_CREDIT", "REFERRAL_REWARD", "UNSTAKE"]);
  const DEBIT_TYPES = new Set(["WITHDRAWAL", "STAKE", "MANUAL_DEBIT"]);

  await db.transaction(async (trx) => {
    await trx.insert(transactionsTable).values({
      userId: id,
      type: type as any,
      amount: amount.toFixed(2),
      status: status as any,
      description: description ?? `Admin created ${type}`,
    });

    if (status === "COMPLETED") {
      const currentBalance = Number(user.availableBalance);
      let newBalance = currentBalance;
      if (CREDIT_TYPES.has(type)) newBalance = currentBalance + amount;
      else if (DEBIT_TYPES.has(type)) newBalance = currentBalance - amount;

      if (newBalance !== currentBalance) {
        await trx.update(usersTable)
          .set({ availableBalance: newBalance.toFixed(2) })
          .where(eq(usersTable.id, id));
      }
    }
  });

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Admin created ${type} transaction of KES ${amount} for user #${id}`,
    targetUserId: id,
    note: description ?? null,
  });

  await createNotification({
    userId: id,
    type: "ADMIN_MESSAGE",
    title: `${type.replace(/_/g, " ")} — KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`,
    message: description ?? `An admin processed a ${type.toLowerCase().replace(/_/g, " ")} on your account.`,
  });

  res.status(201).json({ success: true });
});

// ── Analytics ──────────────────────────────────────────────────────────────
router.get("/admin/analytics", requireAdmin, async (_req, res): Promise<void> => {
  const tvlResult = await db.select({ total: sql<number>`coalesce(sum(current_value), 0)` })
    .from(stakesTable).where(eq(stakesTable.status, "ACTIVE"));

  const depositsResult = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "DEPOSIT"), eq(transactionsTable.status, "COMPLETED")));

  const withdrawalsResult = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "WITHDRAWAL"), eq(transactionsTable.status, "COMPLETED")));

  const activeStakesResult = await db.select({ count: sql<number>`count(*)` })
    .from(stakesTable).where(eq(stakesTable.status, "ACTIVE"));

  const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(usersTable);

  const revenueResult = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "INTEREST"), eq(transactionsTable.status, "COMPLETED")));

  // Daily stats for last 14 days
  const dailyDeposits = await db.select({
    date: sql<string>`date_trunc('day', created_at)::date::text`,
    total: sql<number>`coalesce(sum(amount), 0)`,
  }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "DEPOSIT"), eq(transactionsTable.status, "COMPLETED"),
      sql`created_at >= now() - interval '14 days'`))
    .groupBy(sql`date_trunc('day', created_at)`);

  const dailyWithdrawals = await db.select({
    date: sql<string>`date_trunc('day', created_at)::date::text`,
    total: sql<number>`coalesce(sum(amount), 0)`,
  }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "WITHDRAWAL"), eq(transactionsTable.status, "COMPLETED"),
      sql`created_at >= now() - interval '14 days'`))
    .groupBy(sql`date_trunc('day', created_at)`);

  const dates = [...new Set([...dailyDeposits.map((d) => d.date), ...dailyWithdrawals.map((d) => d.date)])].sort();

  const dailyStats = dates.map((date) => ({
    date,
    deposits: Number(dailyDeposits.find((d) => d.date === date)?.total ?? 0),
    withdrawals: Number(dailyWithdrawals.find((d) => d.date === date)?.total ?? 0),
    newStakes: 0,
    interest: 0,
  }));

  res.json(GetAdminAnalyticsResponse.parse({
    tvl: Number(tvlResult[0]?.total ?? 0),
    totalDeposits: Number(depositsResult[0]?.total ?? 0),
    totalWithdrawals: Number(withdrawalsResult[0]?.total ?? 0),
    activeStakesCount: Number(activeStakesResult[0]?.count ?? 0),
    totalUsers: Number(totalUsersResult[0]?.count ?? 0),
    platformRevenue: Number(revenueResult[0]?.total ?? 0),
    dailyStats,
  }));
});

// ── Withdrawals ─────────────────────────────────────────────────────────────
router.get("/admin/withdrawals", requireAdmin, async (_req, res): Promise<void> => {
  const txs = await db.query.transactionsTable.findMany({
    where: eq(transactionsTable.type, "WITHDRAWAL"),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const userIds = [...new Set(txs.map((t) => t.userId))];
  const users = userIds.length > 0
    ? await db.query.usersTable.findMany({ where: (t, { inArray }) => inArray(t.id, userIds) })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(AdminListWithdrawalsResponse.parse(txs.map((t) => ({
    id: t.id,
    userId: t.userId,
    userEmail: userMap[t.userId]?.email ?? "",
    userFullName: userMap[t.userId]?.fullName ?? null,
    amount: Number(t.amount),
    status: t.status,
    phoneNumber: t.phoneNumber ?? "",
    payheroRef: t.payheroRef ?? null,
    createdAt: t.createdAt.toISOString(),
  }))));
});

router.post("/admin/withdrawals/:id/disburse", requireAdmin, async (req, res): Promise<void> => {
  const params = DisburseWithdrawalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tx = await db.query.transactionsTable.findFirst({ where: eq(transactionsTable.id, params.data.id) });
  if (!tx || tx.type !== "WITHDRAWAL") {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }
  if (tx.status !== "PENDING") {
    res.status(400).json({ error: "Withdrawal is not pending" });
    return;
  }

  // Mark as COMPLETED — withdrawals are manually processed via M-Pesa, no B2C API call
  const [updated] = await db.update(transactionsTable)
    .set({ status: "COMPLETED" })
    .where(eq(transactionsTable.id, tx.id))
    .returning();

  await createNotification({
    userId: tx.userId,
    type: "WITHDRAWAL_APPROVED",
    title: "Withdrawal Disbursed",
    message: `Your withdrawal of KES ${Number(tx.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} has been sent to ${tx.phoneNumber}. Please allow a few minutes for the M-Pesa notification.`,
  });

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Manually disbursed withdrawal #${tx.id} of KES ${tx.amount} to ${tx.phoneNumber}`,
    targetUserId: tx.userId,
  });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
  res.json(DisburseWithdrawalResponse.parse({
    id: updated.id,
    userId: updated.userId,
    userEmail: user?.email ?? "",
    userFullName: user?.fullName ?? null,
    amount: Number(updated.amount),
    status: updated.status,
    phoneNumber: updated.phoneNumber ?? "",
    payheroRef: updated.payheroRef ?? null,
    createdAt: updated.createdAt.toISOString(),
  }));
});

router.post("/admin/withdrawals/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const params = RejectWithdrawalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RejectWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tx = await db.query.transactionsTable.findFirst({ where: eq(transactionsTable.id, params.data.id) });
  if (!tx || tx.status !== "PENDING") {
    res.status(404).json({ error: "Pending withdrawal not found" });
    return;
  }

  // Refund to user
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
  await db.transaction(async (trx) => {
    await trx.update(transactionsTable).set({ status: "REJECTED" }).where(eq(transactionsTable.id, tx.id));
    if (user) {
      await trx.update(usersTable)
        .set({ availableBalance: (Number(user.availableBalance) + Number(tx.amount)).toFixed(2) })
        .where(eq(usersTable.id, tx.userId));
    }
  });

  await createNotification({
    userId: tx.userId,
    type: "WITHDRAWAL_REJECTED",
    title: "Withdrawal Rejected",
    message: `Your withdrawal of KES ${Number(tx.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} was rejected. Reason: ${parsed.data.reason}. Funds returned to your balance.`,
  });

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Rejected withdrawal #${tx.id}`,
    targetUserId: tx.userId,
    note: parsed.data.reason,
  });

  const updated = await db.query.transactionsTable.findFirst({ where: eq(transactionsTable.id, tx.id) });
  res.json(RejectWithdrawalResponse.parse({
    id: updated!.id,
    userId: updated!.userId,
    userEmail: user?.email ?? "",
    userFullName: user?.fullName ?? null,
    amount: Number(updated!.amount),
    status: updated!.status,
    phoneNumber: updated!.phoneNumber ?? "",
    payheroRef: updated!.payheroRef ?? null,
    createdAt: updated!.createdAt.toISOString(),
  }));
});

// ── Audit Logs ──────────────────────────────────────────────────────────────
router.get("/admin/audit-logs", requireAdmin, async (_req, res): Promise<void> => {
  const logs = await db.query.auditLogsTable.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 200,
  });

  const adminIds = [...new Set(logs.map((l) => l.adminId))];
  const admins = adminIds.length > 0
    ? await db.query.usersTable.findMany({ where: (t, { inArray }) => inArray(t.id, adminIds) })
    : [];
  const adminMap = Object.fromEntries(admins.map((u) => [u.id, u]));

  res.json(ListAuditLogsResponse.parse(logs.map((l) => ({
    ...l,
    adminEmail: adminMap[l.adminId]?.email ?? "",
    targetUserId: l.targetUserId ?? null,
    note: l.note ?? null,
    metadata: l.metadata ?? null,
  }))));
});

// ── Settings ────────────────────────────────────────────────────────────────
router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(platformSettingsTable);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  res.json(GetAdminSettingsResponse.parse({
    payheroUsername: map["payhero_username"] ?? "",
    payheroPassword: map["payhero_password"] ?? "",
    payheroChannelId: map["payhero_channel_id"] ?? "",
    tier1ReferralPercent: Number(map["tier1_referral_percent"] ?? "5"),
    tier2ReferralPercent: Number(map["tier2_referral_percent"] ?? "2"),
  }));
});

router.patch("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminRef = String(req.userId!);
  const keyMap: Record<string, string> = {
    payheroUsername: "payhero_username",
    payheroPassword: "payhero_password",
    payheroChannelId: "payhero_channel_id",
    tier1ReferralPercent: "tier1_referral_percent",
    tier2ReferralPercent: "tier2_referral_percent",
  };

  for (const [field, dbKey] of Object.entries(keyMap)) {
    const val = (parsed.data as Record<string, unknown>)[field];
    if (val !== undefined) {
      await db.insert(platformSettingsTable)
        .values({ key: dbKey, value: String(val), updatedBy: adminRef })
        .onConflictDoUpdate({
          target: platformSettingsTable.key,
          set: { value: String(val), updatedBy: adminRef },
        });
    }
  }

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Updated platform settings`,
    note: Object.keys(parsed.data).join(", "),
  });

  const rows = await db.select().from(platformSettingsTable);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  res.json(UpdateAdminSettingsResponse.parse({
    payheroUsername: map["payhero_username"] ?? "",
    payheroPassword: map["payhero_password"] ?? "",
    payheroChannelId: map["payhero_channel_id"] ?? "",
    tier1ReferralPercent: Number(map["tier1_referral_percent"] ?? "5"),
    tier2ReferralPercent: Number(map["tier2_referral_percent"] ?? "2"),
  }));
});

// ── Cron: Process Matured Stakes ─────────────────────────────────────────────
router.post("/admin/cron/process-stakes", requireAdmin, async (_req, res): Promise<void> => {
  const now = new Date();
  const matured = await db.query.stakesTable.findMany({
    where: and(eq(stakesTable.status, "ACTIVE"), sql`end_date <= ${now}`),
    with: { plan: true },
  });

  let completed = 0;
  let autoInvested = 0;

  for (const stake of matured) {
    const roi = Number(stake.plan.roiPercent) / 100;
    const principal = Number(stake.principalAmount);
    const interest = principal * roi;
    const total = principal + interest;

    if (stake.autoInvest) {
      // Roll over: create new stake with same plan, total as principal
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + stake.plan.durationDays);

      await db.transaction(async (tx) => {
        await tx.update(stakesTable).set({ status: "COMPLETED", accruedInterest: interest.toFixed(2) }).where(eq(stakesTable.id, stake.id));

        await tx.insert(stakesTable).values({
          userId: stake.userId,
          planId: stake.planId,
          principalAmount: total.toFixed(2),
          currentValue: total.toFixed(2),
          accruedInterest: "0",
          endDate: newEndDate,
          autoInvest: true,
        });

        const user = await tx.query.usersTable.findFirst({ where: eq(usersTable.id, stake.userId) });
        await tx.update(usersTable).set({
          totalEarnings: (Number(user!.totalEarnings) + interest).toFixed(2),
        }).where(eq(usersTable.id, stake.userId));

        await tx.insert(transactionsTable).values({
          userId: stake.userId,
          type: "INTEREST",
          amount: interest.toFixed(2),
          status: "COMPLETED",
          description: `Auto-invest rollover on ${stake.plan.name}`,
        });
      });
      autoInvested++;
    } else {
      // Return funds to available balance
      await db.transaction(async (tx) => {
        await tx.update(stakesTable).set({ status: "COMPLETED", accruedInterest: interest.toFixed(2) }).where(eq(stakesTable.id, stake.id));

        const user = await tx.query.usersTable.findFirst({ where: eq(usersTable.id, stake.userId) });
        await tx.update(usersTable).set({
          availableBalance: (Number(user!.availableBalance) + total).toFixed(2),
          totalEarnings: (Number(user!.totalEarnings) + interest).toFixed(2),
        }).where(eq(usersTable.id, stake.userId));

        // Log principal return as UNSTAKE so transaction history fully explains the balance change
        await tx.insert(transactionsTable).values({
          userId: stake.userId,
          type: "UNSTAKE",
          amount: principal.toFixed(2),
          status: "COMPLETED",
          description: `Principal returned: ${stake.plan.name}`,
        });

        // Log interest separately
        await tx.insert(transactionsTable).values({
          userId: stake.userId,
          type: "INTEREST",
          amount: interest.toFixed(2),
          status: "COMPLETED",
          description: `Interest earned: ${stake.plan.name} (${stake.plan.roiPercent}% ROI)`,
        });
      });

      await createNotification({
        userId: stake.userId,
        type: "STAKE_MATURED",
        title: "Stake Matured",
        message: `Your ${stake.plan.name} stake has matured. KES ${total.toLocaleString("en-KE", { minimumFractionDigits: 2 })} (principal + interest) returned to your balance.`,
      });
      completed++;
    }
  }

  res.json(ProcessMaturedStakesResponse.parse({ processed: matured.length, autoInvested, completed }));
});

// ── All Transactions ────────────────────────────────────────────────────────
router.get("/admin/transactions", requireAdmin, async (_req, res): Promise<void> => {
  const txs = await db.query.transactionsTable.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 1000,
  });

  const userIds = [...new Set(txs.map((t) => t.userId))];
  const users = userIds.length > 0
    ? await db.query.usersTable.findMany({ where: (t, { inArray }) => inArray(t.id, userIds) })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(txs.map((t) => ({
    id: t.id,
    userId: t.userId,
    userEmail: userMap[t.userId]?.email ?? "",
    userFullName: userMap[t.userId]?.fullName ?? null,
    type: t.type,
    amount: Number(t.amount),
    status: t.status,
    description: t.description ?? null,
    phoneNumber: t.phoneNumber ?? null,
    externalReference: t.externalReference ?? null,
    createdAt: t.createdAt.toISOString(),
  })));
});

// Simulate deposit completion (dev/testing only)
router.post("/admin/transactions/:id/simulate-complete", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid transaction id" });
    return;
  }

  const tx = await db.query.transactionsTable.findFirst({ where: eq(transactionsTable.id, id) });
  if (!tx || tx.type !== "DEPOSIT" || tx.status !== "PENDING") {
    res.status(400).json({ error: "Transaction must be a pending deposit" });
    return;
  }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.transaction(async (trx) => {
    await trx.update(transactionsTable)
      .set({ status: "COMPLETED", payheroRef: tx.externalReference })
      .where(eq(transactionsTable.id, tx.id));
    await trx.update(usersTable)
      .set({ availableBalance: (Number(user.availableBalance) + Number(tx.amount)).toFixed(2) })
      .where(eq(usersTable.id, tx.userId));
  });

  await createNotification({
    userId: tx.userId,
    type: "DEPOSIT",
    title: "Deposit Successful",
    message: `KES ${Number(tx.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} has been credited to your account.`,
  });

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Simulated deposit completion for tx #${tx.id}`,
    targetUserId: tx.userId,
    note: `Amount: ${tx.amount}`,
  });

  res.json({ ok: true, txId: tx.id, amount: Number(tx.amount) });
});

// Test PayHero connection
router.post("/admin/settings/test-payhero", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const rows = await db.select().from(platformSettingsTable);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const username = map["payhero_username"] ?? "";
    const password = map["payhero_password"] ?? "";
    const channelId = map["payhero_channel_id"] ?? "";

    if (!username || !password) {
      res.json({ ok: false, error: "Credentials not configured. Please save username and password first." });
      return;
    }

    const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    const testRes = await fetch("https://backend.payhero.co.ke/api/v2/payments?page=1&per_page=1", {
      headers: { Authorization: auth, "Content-Type": "application/json" },
    });

    if (testRes.ok || testRes.status === 404) {
      res.json({ ok: true, message: `Connected successfully${channelId ? ` (Channel: ${channelId})` : ""}. Ready to process M-Pesa payments.` });
    } else {
      const body = await testRes.json().catch(() => ({})) as Record<string, unknown>;
      res.json({ ok: false, error: `PayHero returned ${testRes.status}: ${JSON.stringify(body)}` });
    }
  } catch (err: any) {
    res.json({ ok: false, error: `Network error: ${err.message}` });
  }
});

// ── Extended Settings (WhatsApp, Cloudinary) ────────────────────────────────
const EXTENDED_SETTING_KEYS = ["whatsapp_number", "cloudinary_cloud_name", "cloudinary_upload_preset"];

router.get("/admin/settings/extended", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(platformSettingsTable)
    .where(inArray(platformSettingsTable.key, EXTENDED_SETTING_KEYS as any));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({
    whatsappNumber: map["whatsapp_number"] ?? "",
    cloudinaryCloudName: map["cloudinary_cloud_name"] ?? "",
    cloudinaryUploadPreset: map["cloudinary_upload_preset"] ?? "",
  });
});

router.patch("/admin/settings/extended", requireAdmin, async (req, res): Promise<void> => {
  const { whatsappNumber, cloudinaryCloudName, cloudinaryUploadPreset } = req.body as Record<string, string>;
  const adminRef = String(req.userId!);
  const keyMap: Record<string, string> = {
    whatsappNumber: "whatsapp_number",
    cloudinaryCloudName: "cloudinary_cloud_name",
    cloudinaryUploadPreset: "cloudinary_upload_preset",
  };
  for (const [field, dbKey] of Object.entries(keyMap)) {
    const val = req.body[field];
    if (val !== undefined) {
      await db.insert(platformSettingsTable)
        .values({ key: dbKey, value: String(val), updatedBy: adminRef })
        .onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: String(val), updatedBy: adminRef } });
    }
  }
  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: "Updated extended platform settings",
    note: Object.keys(req.body).join(", "),
  });
  res.json({ whatsappNumber, cloudinaryCloudName, cloudinaryUploadPreset });
});

// ── Public Settings (no auth, returns non-sensitive config) ─────────────────
router.get("/settings/public", async (_req, res): Promise<void> => {
  const rows = await db.select().from(platformSettingsTable)
    .where(inArray(platformSettingsTable.key, ["whatsapp_number", "cloudinary_cloud_name", "cloudinary_upload_preset"] as any));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({
    whatsappNumber: map["whatsapp_number"] ?? "",
    cloudinaryCloudName: map["cloudinary_cloud_name"] ?? "",
    cloudinaryUploadPreset: map["cloudinary_upload_preset"] ?? "",
    qrokEnabled: Boolean(process.env.QROK_API_KEY),
  });
});

// ── Delete User ────────────────────────────────────────────────────────────────
router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const target = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "ADMIN") { res.status(403).json({ error: "Cannot delete admin users" }); return; }
  if (target.id === req.userId!) { res.status(403).json({ error: "Cannot delete your own account" }); return; }

  // Delete all related records first
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, id));
  await db.delete(notificationsTable).where(eq(notificationsTable.userId, id));
  await db.delete(referralsTable).where(eq(referralsTable.referrerId, id));
  await db.delete(referralsTable).where(eq(referralsTable.refereeId, id));
  await db.delete(stakesTable).where(eq(stakesTable.userId, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Deleted user #${id} (${target.email})`,
    targetUserId: null,
    note: `Deleted by admin. Email: ${target.email}`,
  });

  res.json({ ok: true });
});

// ── User Transactions (admin view) ──────────────────────────────────────────
router.get("/admin/users/:id/transactions", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  const txs = await db.query.transactionsTable.findMany({
    where: eq(transactionsTable.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 500,
  });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });

  res.json(txs.map((t) => ({
    id: t.id,
    userId: t.userId,
    userEmail: user?.email ?? "",
    userFullName: user?.fullName ?? null,
    type: t.type,
    amount: Number(t.amount),
    status: t.status,
    description: t.description ?? null,
    phoneNumber: t.phoneNumber ?? null,
    externalReference: t.externalReference ?? null,
    createdAt: t.createdAt.toISOString(),
  })));
});

// ── Transaction Update ────────────────────────────────────────────────────────
router.patch("/admin/transactions/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, description, createdAt } = req.body as { status?: string; description?: string; createdAt?: string };
  const allowed = ["PENDING", "COMPLETED", "FAILED", "REJECTED"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  const tx = await db.query.transactionsTable.findFirst({ where: eq(transactionsTable.id, id) });
  if (!tx) { res.status(404).json({ error: "Transaction not found" }); return; }

  const updates: any = {};
  if (status) updates.status = status;
  if (description !== undefined) updates.description = description;
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) updates.createdAt = d;
  }

  const [updated] = await db.update(transactionsTable).set(updates).where(eq(transactionsTable.id, id)).returning();

  if (status === "COMPLETED" && tx.type === "DEPOSIT" && tx.status !== "COMPLETED") {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
    if (user) {
      await db.update(usersTable)
        .set({ availableBalance: (Number(user.availableBalance) + Number(tx.amount)).toFixed(2) })
        .where(eq(usersTable.id, tx.userId));
      await createNotification({ userId: tx.userId, type: "DEPOSIT", title: "Deposit Successful",
        message: `KES ${Number(tx.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} has been credited to your account.` });
    }
  }
  if (status === "REJECTED" && tx.type === "WITHDRAWAL" && tx.status === "PENDING") {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
    if (user) {
      await db.update(usersTable)
        .set({ availableBalance: (Number(user.availableBalance) + Number(tx.amount)).toFixed(2) })
        .where(eq(usersTable.id, tx.userId));
    }
  }

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Updated transaction #${id}: ${JSON.stringify(updates)}`,
    targetUserId: tx.userId,
  });

  const userRow = await db.query.usersTable.findFirst({ where: eq(usersTable.id, updated.userId) });
  res.json({
    id: updated.id, userId: updated.userId,
    userEmail: userRow?.email ?? "", userFullName: userRow?.fullName ?? null,
    type: updated.type, amount: Number(updated.amount), status: updated.status,
    description: updated.description ?? null, phoneNumber: updated.phoneNumber ?? null,
    externalReference: updated.externalReference ?? null, createdAt: updated.createdAt.toISOString(),
  });
});

// ── User Stakes (admin view) ──────────────────────────────────────────────────
router.get("/admin/users/:id/stakes", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const stakes = await db.query.stakesTable.findMany({
    where: eq(stakesTable.userId, userId),
    with: { plan: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  res.json(stakes.map((s) => ({
    id: s.id, userId: s.userId, planId: s.planId,
    planName: s.plan.name, roiPercent: Number(s.plan.roiPercent),
    durationDays: s.plan.durationDays,
    principalAmount: Number(s.principalAmount),
    currentValue: Number(s.currentValue),
    accruedInterest: Number(s.accruedInterest),
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    status: s.status, autoInvest: s.autoInvest,
    createdAt: s.createdAt.toISOString(),
  })));
});

// ── KYC Admin Controls ────────────────────────────────────────────────────────
router.post("/admin/users/:id/kyc/request", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.update(usersTable)
    .set({ kycStatus: "REQUESTED", kycRequestedAt: new Date() })
    .where(eq(usersTable.id, userId));

  await createNotification({ userId, type: "ADMIN_MESSAGE", title: "KYC Verification Required",
    message: "Your account requires identity verification. Please upload a clear photo of your National ID or Passport from your Profile page." });

  await db.insert(auditLogsTable).values({
    adminId: req.userId!, action: `Requested KYC from user #${userId}`, targetUserId: userId,
  });
  res.json({ ok: true });
});

router.patch("/admin/users/:id/kyc/review", requireAdmin, async (req, res): Promise<void> => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const { decision, note } = req.body as { decision: "APPROVED" | "REJECTED"; note?: string };
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    res.status(400).json({ error: "decision must be APPROVED or REJECTED" }); return;
  }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.update(usersTable).set({ kycStatus: decision }).where(eq(usersTable.id, userId));

  await createNotification({ userId, type: "ADMIN_MESSAGE",
    title: decision === "APPROVED" ? "KYC Approved ✓" : "KYC Rejected",
    message: decision === "APPROVED"
      ? "Your identity verification has been approved. Your account is now fully verified."
      : `Your KYC submission was rejected. ${note ? `Reason: ${note}.` : ""} Please re-upload a clearer document.` });

  await db.insert(auditLogsTable).values({
    adminId: req.userId!, action: `KYC ${decision} for user #${userId}`, targetUserId: userId, note: note ?? null,
  });
  res.json({ ok: true });
});

// ── Referrals ──────────────────────────────────────────────────────────────
router.get("/admin/referrals", requireAdmin, async (_req, res): Promise<void> => {
  const referrals = await db
    .select({
      id: referralsTable.id,
      tier: referralsTable.tier,
      rewardAmount: referralsTable.rewardAmount,
      paidAt: referralsTable.paidAt,
      createdAt: referralsTable.createdAt,
      referrerId: referralsTable.referrerId,
      refereeId: referralsTable.refereeId,
    })
    .from(referralsTable)
    .orderBy(desc(referralsTable.createdAt))
    .limit(500);

  const allIds = [...new Set([...referrals.map((r) => r.referrerId), ...referrals.map((r) => r.refereeId)])];
  const users = allIds.length > 0
    ? await db.select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(inArray(usersTable.id, allIds))
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  res.json(referrals.map((r) => ({
    id: r.id,
    tier: r.tier,
    rewardAmount: Number(r.rewardAmount),
    paidAt: r.paidAt,
    createdAt: r.createdAt,
    referrer: userMap[r.referrerId] ?? { id: r.referrerId, email: "Unknown", fullName: null },
    referee: userMap[r.refereeId] ?? { id: r.refereeId, email: "Unknown", fullName: null },
  })));
});

// Mark referral as paid
router.post("/admin/referrals/:id/mark-paid", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid referral id" });
    return;
  }

  const updated = await db.update(referralsTable)
    .set({ paidAt: new Date() })
    .where(eq(referralsTable.id, id))
    .returning();

  if (!updated.length) {
    res.status(404).json({ error: "Referral not found" });
    return;
  }

  await db.insert(auditLogsTable).values({
    adminId: req.userId!,
    action: `Marked referral #${id} as paid`,
    targetUserId: updated[0].referrerId,
  });

  res.json({ ok: true });
});

export default router;
