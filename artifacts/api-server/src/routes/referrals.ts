import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, referralsTable, usersTable, stakesTable, transactionsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { GetReferralsResponse } from "@workspace/api-zod";

const router = Router();

router.get("/referrals", requireAuth, async (req, res): Promise<void> => {
  const user = req.dbUser!;

  // ── Tier 1: users who signed up with this user's referral code ──────────
  const tier1Users = await db.query.usersTable.findMany({
    where: eq(usersTable.referredBy, user.referralCode),
  });

  // ── Tier 2: users who signed up with any tier-1 user's referral code ───
  const tier1ReferralCodes = tier1Users
    .map((u) => u.referralCode)
    .filter(Boolean) as string[];

  const tier2Users =
    tier1ReferralCodes.length > 0
      ? await db.query.usersTable.findMany({
          where: (t, { inArray }) =>
            inArray(t.referredBy, tier1ReferralCodes),
        })
      : [];

  // ── Active stake check ─────────────────────────────────────────────────
  const allRefereeIds = [
    ...tier1Users.map((u) => u.id),
    ...tier2Users.map((u) => u.id),
  ];

  const activeStakeCounts =
    allRefereeIds.length > 0
      ? await db
          .select({
            userId: stakesTable.userId,
            count: sql<number>`count(*)`,
          })
          .from(stakesTable)
          .where(
            sql`${stakesTable.userId} = any(${allRefereeIds}) AND ${stakesTable.status} = 'ACTIVE'`
          )
          .groupBy(stakesTable.userId)
      : [];

  const stakeMap = Object.fromEntries(
    activeStakeCounts.map((s) => [s.userId, Number(s.count)])
  );

  // ── Earnings: referralsTable first, then fall back to transactions ──────
  //
  // referralsTable rows are inserted by handleReferralReward when a staker
  // has a referrer. For accounts created before this system was in place,
  // the rows may not exist or may have rewardAmount = 0.  In those cases
  // we fall back to summing REFERRAL_REWARD transactions (which are always
  // created alongside the balance credit).

  const tier1Refs = await db.query.referralsTable.findMany({
    where: and(
      eq(referralsTable.referrerId, req.userId!),
      eq(referralsTable.tier, 1)
    ),
  });
  const tier2Refs = await db.query.referralsTable.findMany({
    where: and(
      eq(referralsTable.referrerId, req.userId!),
      eq(referralsTable.tier, 2)
    ),
  });

  let tier1Earnings = tier1Refs.reduce(
    (acc, r) => acc + Number(r.rewardAmount),
    0
  );
  let tier2Earnings = tier2Refs.reduce(
    (acc, r) => acc + Number(r.rewardAmount),
    0
  );

  // If referralsTable has no recorded earnings, derive from transactions
  if (tier1Earnings === 0 && tier2Earnings === 0) {
    const rewardTxns = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.userId, req.userId!),
          eq(transactionsTable.type, "REFERRAL_REWARD")
        )
      );

    for (const tx of rewardTxns) {
      // Description set in handleReferralReward: "Tier 1 ..." or "Tier 2 ..."
      if (tx.description?.startsWith("Tier 2")) {
        tier2Earnings += Number(tx.amount);
      } else {
        tier1Earnings += Number(tx.amount);
      }
    }
  }

  // ── Build referral link ─────────────────────────────────────────────────
  const baseUrl =
    process.env.BASE_URL ??
    (process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "");
  const referralLink = `${baseUrl}/sign-up?ref=${user.referralCode}`;

  // ── Referred users list ─────────────────────────────────────────────────
  const tier1Set = new Set(tier1Users.map((u) => u.id));

  const referredUsers = [
    ...tier1Users.map((u) => ({ ...u, tier: 1 as const })),
    ...tier2Users.map((u) => ({ ...u, tier: 2 as const })),
  ].map((u) => ({
    id: u.id,
    fullName: u.fullName ?? null,
    email: u.email,
    tier: tier1Set.has(u.id) ? 1 : 2,
    joinedAt: u.createdAt.toISOString(),
    hasActiveStake: (stakeMap[u.id] ?? 0) > 0,
  }));

  res.json(
    GetReferralsResponse.parse({
      referralCode: user.referralCode,
      referralLink,
      tier1Count: tier1Users.length,
      tier2Count: tier2Users.length,
      tier1Earnings,
      tier2Earnings,
      referredUsers,
    })
  );
});

export default router;
