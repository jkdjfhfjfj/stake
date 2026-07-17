import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, referralsTable, usersTable, stakesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { GetReferralsResponse } from "@workspace/api-zod";

const router = Router();

router.get("/referrals", requireAuth, async (req, res): Promise<void> => {
  const user = req.dbUser!;

  // Tier 1 referrals (user directly referred)
  const tier1Refs = await db.query.referralsTable.findMany({
    where: eq(referralsTable.referrerId, req.userId!),
  });

  const tier1Ids = tier1Refs.map((r) => r.refereeId);

  // Tier 2 referrals (people referred by user's tier-1 referees)
  const tier2Refs = tier1Ids.length > 0
    ? await db.query.referralsTable.findMany({
        where: (t, { inArray }) => inArray(t.referrerId, tier1Ids),
      })
    : [];

  const allRefereeIds = [...new Set([...tier1Ids, ...tier2Refs.map((r) => r.refereeId)])];

  const referredUsersData = allRefereeIds.length > 0
    ? await db.query.usersTable.findMany({
        where: (t, { inArray }) => inArray(t.id, allRefereeIds),
      })
    : [];

  // Active stakes per user
  const activeStakeCounts = allRefereeIds.length > 0
    ? await db.select({ userId: stakesTable.userId, count: sql<number>`count(*)` })
        .from(stakesTable)
        .where(sql`${stakesTable.userId} = any(${allRefereeIds})`)
        .groupBy(stakesTable.userId)
    : [];

  const stakeMap = Object.fromEntries(activeStakeCounts.map((s) => [s.userId, Number(s.count)]));

  const tier1Earnings = tier1Refs.reduce((acc, r) => acc + Number(r.rewardAmount), 0);
  const tier2Earnings = tier2Refs.reduce((acc, r) => acc + Number(r.rewardAmount), 0);

  const baseUrl = process.env.BASE_URL
    ?? (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "");
  const referralLink = `${baseUrl}/sign-up?ref=${user.referralCode}`;

  const referredUsers = referredUsersData.map((u) => {
    const tier = tier1Ids.includes(u.id) ? 1 : 2;
    return {
      id: u.id,
      fullName: u.fullName ?? null,
      email: u.email,
      tier,
      joinedAt: u.createdAt.toISOString(),
      hasActiveStake: (stakeMap[u.id] ?? 0) > 0,
    };
  });

  res.json(GetReferralsResponse.parse({
    referralCode: user.referralCode,
    referralLink,
    tier1Count: tier1Ids.length,
    tier2Count: tier2Refs.length,
    tier1Earnings,
    tier2Earnings,
    referredUsers,
  }));
});

export default router;
