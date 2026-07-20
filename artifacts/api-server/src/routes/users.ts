import { Router } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import { db, usersTable, stakesTable, transactionsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import {
  GetMeResponse,
  UpdateMeBody,
  CompleteOnboardingBody,
  GetDashboardResponse,
  ListTransactionsResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.dbUser!;
  res.json(GetMeResponse.parse({
    ...user,
    availableBalance: Number(user.availableBalance),
    totalEarnings: Number(user.totalEarnings),
    referralRewards: Number(user.referralRewards),
  }));
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  // Allow extra fields beyond the generated schema (bankName, bankAccountNumber)
  const { bankName, bankAccountNumber, ...rest } = req.body as any;
  const parsed = UpdateMeBody.safeParse(rest);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: any = { ...parsed.data };
  if (bankName !== undefined) updateData.bankName = bankName || null;
  if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber || null;

  const [updated] = await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.userId!))
    .returning();
  res.json(GetMeResponse.parse({
    ...updated,
    availableBalance: Number(updated.availableBalance),
    totalEarnings: Number(updated.totalEarnings),
    referralRewards: Number(updated.referralRewards),
  }));
});

router.post("/users/me/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }
  const user = req.dbUser!;
  if (!user.passwordHash) {
    res.status(400).json({ error: "No password set on this account" });
    return;
  }
  const valid = await (await import("bcryptjs")).default.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const newHash = await (await import("bcryptjs")).default.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, req.userId!));
  res.json({ ok: true });
});

router.post("/users/me/onboarding", requireAuth, async (req, res): Promise<void> => {
  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(usersTable)
    .set({ ...parsed.data, onboardingComplete: true })
    .where(eq(usersTable.id, req.userId!))
    .returning();
  res.json(GetMeResponse.parse({
    ...updated,
    availableBalance: Number(updated.availableBalance),
    totalEarnings: Number(updated.totalEarnings),
    referralRewards: Number(updated.referralRewards),
  }));
});

router.get("/users/me/kyc", requireAuth, async (req, res): Promise<void> => {
  const user = req.dbUser!;
  res.json({
    kycStatus: user.kycStatus ?? "NONE",
    kycDocumentUrl: user.kycDocumentUrl ?? null,
    kycRequestedAt: user.kycRequestedAt ? user.kycRequestedAt.toISOString() : null,
  });
});

router.patch("/users/me/kyc", requireAuth, async (req, res): Promise<void> => {
  const { documentUrl } = req.body as { documentUrl?: string };
  if (!documentUrl) { res.status(400).json({ error: "documentUrl is required" }); return; }
  const user = req.dbUser!;
  if (!["REQUESTED", "REJECTED"].includes(user.kycStatus ?? "NONE")) {
    res.status(400).json({ error: "KYC has not been requested by admin" }); return;
  }
  await db.update(usersTable).set({ kycStatus: "SUBMITTED", kycDocumentUrl: documentUrl })
    .where(eq(usersTable.id, req.userId!));
  res.json({ ok: true, kycStatus: "SUBMITTED" });
});

router.get("/users/me/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = req.dbUser!;

  const activeStakes = await db.select({ count: sql<number>`count(*)` })
    .from(stakesTable)
    .where(and(eq(stakesTable.userId, req.userId!), eq(stakesTable.status, "ACTIVE")));

  const totalStakedResult = await db.select({ total: sql<number>`coalesce(sum(current_value), 0)` })
    .from(stakesTable)
    .where(and(eq(stakesTable.userId, req.userId!), eq(stakesTable.status, "ACTIVE")));

  const recentTxs = await db.select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, req.userId!))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(5);

  res.json(GetDashboardResponse.parse({
    availableBalance: Number(user.availableBalance),
    totalStaked: Number(totalStakedResult[0]?.total ?? 0),
    totalEarnings: Number(user.totalEarnings),
    referralRewards: Number(user.referralRewards),
    activeStakesCount: Number(activeStakes[0]?.count ?? 0),
    recentTransactions: recentTxs.map((t) => ({
      ...t,
      amount: Number(t.amount),
      externalReference: t.externalReference ?? null,
      payheroRef: t.payheroRef ?? null,
    })),
  }));
});

export default router;
