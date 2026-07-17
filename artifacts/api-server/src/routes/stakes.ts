import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, stakesTable, stakingPlansTable, usersTable, transactionsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { createNotification } from "../lib/notifications";
import {
  ListStakesResponse,
  CreateStakeBody,
  BreakStakeParams,
  BreakStakeResponse,
} from "@workspace/api-zod";

const router = Router();

function parseStake(s: typeof stakesTable.$inferSelect, plan: typeof stakingPlansTable.$inferSelect) {
  return {
    ...s,
    principalAmount: Number(s.principalAmount),
    currentValue: Number(s.currentValue),
    accruedInterest: Number(s.accruedInterest),
    plan: {
      ...plan,
      roiPercent: Number(plan.roiPercent),
      minAmount: Number(plan.minAmount),
      maxAmount: Number(plan.maxAmount),
      earlyWithdrawalPenalty: Number(plan.earlyWithdrawalPenalty),
    },
  };
}

router.get("/stakes", requireAuth, async (req, res): Promise<void> => {
  const stakes = await db.query.stakesTable.findMany({
    where: eq(stakesTable.userId, req.userId!),
    with: { plan: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  res.json(ListStakesResponse.parse(
    stakes.map((s) => parseStake(s, s.plan))
  ));
});

router.post("/stakes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateStakeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { planId, amount, autoInvest } = parsed.data;
  const user = req.dbUser!;

  const plan = await db.query.stakingPlansTable.findFirst({ where: eq(stakingPlansTable.id, planId) });
  if (!plan || !plan.isActive) {
    res.status(404).json({ error: "Staking plan not found or inactive" });
    return;
  }

  if (amount < Number(plan.minAmount) || amount > Number(plan.maxAmount)) {
    res.status(400).json({ error: `Amount must be between KES ${plan.minAmount} and KES ${plan.maxAmount}` });
    return;
  }

  if (Number(user.availableBalance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // Atomic: deduct balance, create stake, log transaction
  const result = await db.transaction(async (tx) => {
    const [newStake] = await tx.insert(stakesTable).values({
      userId: req.userId!,
      planId,
      principalAmount: amount.toString(),
      currentValue: amount.toString(),
      accruedInterest: "0",
      endDate,
      autoInvest: autoInvest ?? false,
    }).returning();

    await tx.update(usersTable)
      .set({ availableBalance: (Number(user.availableBalance) - amount).toFixed(2) })
      .where(eq(usersTable.id, req.userId!));

    await tx.insert(transactionsTable).values({
      userId: req.userId!,
      type: "STAKE",
      amount: amount.toString(),
      status: "COMPLETED",
      description: `Staked in ${plan.name} for ${plan.durationDays} days`,
    });

    return newStake;
  });

  // Handle referral rewards on first stake
  await handleReferralReward(req.userId!, amount);

  await createNotification({
    userId: req.userId!,
    type: "DEPOSIT",
    title: "Stake Created",
    message: `Your stake of KES ${amount.toLocaleString()} in ${plan.name} has been created.`,
  });

  const stakeWithPlan = await db.query.stakesTable.findFirst({
    where: eq(stakesTable.id, result.id),
    with: { plan: true },
  });

  res.status(201).json(BreakStakeResponse.parse(parseStake(stakeWithPlan!, stakeWithPlan!.plan)));
});

router.post("/stakes/:id/break", requireAuth, async (req, res): Promise<void> => {
  const params = BreakStakeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const stake = await db.query.stakesTable.findFirst({
    where: and(eq(stakesTable.id, params.data.id), eq(stakesTable.userId, req.userId!)),
    with: { plan: true },
  });

  if (!stake) {
    res.status(404).json({ error: "Stake not found" });
    return;
  }

  if (stake.status !== "ACTIVE") {
    res.status(400).json({ error: "Only active stakes can be broken" });
    return;
  }

  // Enforce lock period — principal cannot be withdrawn before lockPeriodDays
  const lockPeriodDays = Number((stake.plan as any).lockPeriodDays ?? 0);
  if (lockPeriodDays > 0) {
    const lockUntil = new Date(stake.startDate.getTime() + lockPeriodDays * 24 * 60 * 60 * 1000);
    if (new Date() < lockUntil) {
      const daysLeft = Math.ceil((lockUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      res.status(400).json({ error: `This plan has a ${lockPeriodDays}-day lock period. You can withdraw in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.` });
      return;
    }
  }

  const penalty = Number(stake.plan.earlyWithdrawalPenalty) / 100;
  const principal = Number(stake.principalAmount);
  const returned = principal * (1 - penalty);

  const [updated] = await db.transaction(async (tx) => {
    const [s] = await tx.update(stakesTable)
      .set({ status: "BROKEN" })
      .where(eq(stakesTable.id, stake.id))
      .returning();

    const user = await tx.query.usersTable.findFirst({ where: eq(usersTable.id, req.userId!) });
    await tx.update(usersTable)
      .set({ availableBalance: (Number(user!.availableBalance) + returned).toFixed(2) })
      .where(eq(usersTable.id, req.userId!));

    await tx.insert(transactionsTable).values({
      userId: req.userId!,
      type: "UNSTAKE",
      amount: returned.toFixed(2),
      status: "COMPLETED",
      description: `Early withdrawal from ${stake.plan.name} (${Number(stake.plan.earlyWithdrawalPenalty)}% penalty applied)`,
    });

    return [s];
  });

  await createNotification({
    userId: req.userId!,
    type: "STAKE_MATURED",
    title: "Stake Broken Early",
    message: `KES ${returned.toLocaleString("en-KE", { minimumFractionDigits: 2 })} returned after ${Number(stake.plan.earlyWithdrawalPenalty)}% penalty.`,
  });

  const fresh = await db.query.stakesTable.findFirst({ where: eq(stakesTable.id, updated.id), with: { plan: true } });
  res.json(BreakStakeResponse.parse(parseStake(fresh!, fresh!.plan)));
});

async function handleReferralReward(userId: number, stakeAmount: number) {
  try {
    const { referralsTable, platformSettingsTable } = await import("@workspace/db");
    const { createNotification: notify } = await import("../lib/notifications");
    const referrer = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!referrer?.referredBy) return;

    // Check if this is user's first stake
    const priorStakes = await db.select().from(stakesTable).where(eq(stakesTable.userId, userId));
    if (priorStakes.length > 1) return; // not first stake

    const settings = await db.select().from(platformSettingsTable);
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const tier1Pct = Number(settingsMap["tier1_referral_percent"] ?? "5") / 100;
    const tier2Pct = Number(settingsMap["tier2_referral_percent"] ?? "2") / 100;

    // Tier 1 referrer
    const tier1User = await db.query.usersTable.findFirst({ where: eq(usersTable.referralCode, referrer.referredBy) });
    if (!tier1User) return;

    const tier1Reward = stakeAmount * tier1Pct;
    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({
        referralRewards: (Number(tier1User.referralRewards) + tier1Reward).toFixed(2),
        availableBalance: (Number(tier1User.availableBalance) + tier1Reward).toFixed(2),
      }).where(eq(usersTable.id, tier1User.id));

      await tx.insert(referralsTable).values({
        referrerId: tier1User.id,
        refereeId: userId,
        tier: 1,
        rewardAmount: tier1Reward.toFixed(2),
        paidAt: new Date(),
      });

      await tx.insert(transactionsTable).values({
        userId: tier1User.id,
        type: "REFERRAL_REWARD",
        amount: tier1Reward.toFixed(2),
        status: "COMPLETED",
        description: `Tier 1 referral reward from new staker`,
      });
    });

    await notify({
      userId: tier1User.id,
      type: "REFERRAL_EARNED",
      title: "Referral Reward Earned",
      message: `You earned KES ${tier1Reward.toLocaleString("en-KE", { minimumFractionDigits: 2 })} referral reward!`,
    });

    // Tier 2 referrer
    if (!tier1User.referredBy) return;
    const tier2User = await db.query.usersTable.findFirst({ where: eq(usersTable.referralCode, tier1User.referredBy) });
    if (!tier2User) return;

    const tier2Reward = stakeAmount * tier2Pct;
    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({
        referralRewards: (Number(tier2User.referralRewards) + tier2Reward).toFixed(2),
        availableBalance: (Number(tier2User.availableBalance) + tier2Reward).toFixed(2),
      }).where(eq(usersTable.id, tier2User.id));

      await tx.insert(referralsTable).values({
        referrerId: tier2User.id,
        refereeId: userId,
        tier: 2,
        rewardAmount: tier2Reward.toFixed(2),
        paidAt: new Date(),
      });

      await tx.insert(transactionsTable).values({
        userId: tier2User.id,
        type: "REFERRAL_REWARD",
        amount: tier2Reward.toFixed(2),
        status: "COMPLETED",
        description: `Tier 2 referral reward from new staker`,
      });
    });
  } catch (e) {
    // Non-fatal - log and continue
    console.error("Referral reward error", e);
  }
}

export default router;
