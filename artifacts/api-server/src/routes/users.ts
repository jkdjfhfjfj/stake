import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
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
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.userId!))
    .returning();
  res.json(GetMeResponse.parse({
    ...updated,
    availableBalance: Number(updated.availableBalance),
    totalEarnings: Number(updated.totalEarnings),
    referralRewards: Number(updated.referralRewards),
  }));
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

router.get("/users/me/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = req.dbUser!;

  const activeStakes = await db.select({ count: sql<number>`count(*)` })
    .from(stakesTable)
    .where(eq(stakesTable.userId, req.userId!));

  const totalStakedResult = await db.select({ total: sql<number>`coalesce(sum(current_value), 0)` })
    .from(stakesTable)
    .where(eq(stakesTable.userId, req.userId!));

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
