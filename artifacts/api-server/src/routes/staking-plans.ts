import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, stakingPlansTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import {
  ListStakingPlansResponse,
  CreateStakingPlanBody,
  UpdateStakingPlanParams,
  UpdateStakingPlanBody,
  UpdateStakingPlanResponse,
  DeleteStakingPlanParams,
} from "@workspace/api-zod";

const router = Router();

function parsePlan(p: typeof stakingPlansTable.$inferSelect) {
  return {
    ...p,
    roiPercent: Number(p.roiPercent),
    minAmount: Number(p.minAmount),
    maxAmount: Number(p.maxAmount),
    earlyWithdrawalPenalty: Number(p.earlyWithdrawalPenalty),
    lockPeriodDays: Number((p as any).lockPeriodDays ?? 0),
  };
}

router.get("/staking-plans", requireAuth, async (_req, res): Promise<void> => {
  const plans = await db.select().from(stakingPlansTable).where(eq(stakingPlansTable.isActive, true));
  res.json(plans.map(parsePlan));
});

router.post("/staking-plans", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateStakingPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const { lockPeriodDays: lpd, ...rest } = req.body as any;
  const [plan] = await db.insert(stakingPlansTable).values({
    ...rest,
    name: d.name,
    durationDays: d.durationDays,
    isActive: d.isActive,
    roiPercent: String(d.roiPercent),
    minAmount: String(d.minAmount),
    maxAmount: String(d.maxAmount),
    earlyWithdrawalPenalty: String(d.earlyWithdrawalPenalty),
    lockPeriodDays: Number(lpd) || 0,
  } as any).returning();
  res.status(201).json({ ...UpdateStakingPlanResponse.parse(parsePlan(plan)), lockPeriodDays: parsePlan(plan).lockPeriodDays });
});

router.patch("/staking-plans/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateStakingPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStakingPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ud = parsed.data;
  const { lockPeriodDays: lpd } = req.body as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...ud };
  if (ud.roiPercent !== undefined) updateData.roiPercent = String(ud.roiPercent);
  if (ud.minAmount !== undefined) updateData.minAmount = String(ud.minAmount);
  if (ud.maxAmount !== undefined) updateData.maxAmount = String(ud.maxAmount);
  if (ud.earlyWithdrawalPenalty !== undefined) updateData.earlyWithdrawalPenalty = String(ud.earlyWithdrawalPenalty);
  if (lpd !== undefined) updateData.lockPeriodDays = Number(lpd) || 0;
  const [plan] = await db.update(stakingPlansTable)
    .set(updateData)
    .where(eq(stakingPlansTable.id, params.data.id))
    .returning();
  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }
  res.json({ ...UpdateStakingPlanResponse.parse(parsePlan(plan)), lockPeriodDays: parsePlan(plan).lockPeriodDays });
});

router.delete("/staking-plans/all", requireAdmin, async (_req, res): Promise<void> => {
  await db.delete(stakingPlansTable);
  res.json({ ok: true });
});

router.delete("/staking-plans/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteStakingPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(stakingPlansTable).where(eq(stakingPlansTable.id, params.data.id));
  res.json({ ok: true });
});

export default router;
