import { db, stakingPlansTable, platformSettingsTable } from "@workspace/db";

async function seed() {
  const plans = [
    { name: "Express", durationDays: 7,   roiPercent: "3.00",  minAmount: "500.00",   maxAmount: "30000.00",  earlyWithdrawalPenalty: "5.00",  isActive: true },
    { name: "Starter", durationDays: 30,  roiPercent: "8.00",  minAmount: "1000.00",  maxAmount: "50000.00",  earlyWithdrawalPenalty: "10.00", isActive: true },
    { name: "Growth",  durationDays: 90,  roiPercent: "15.00", minAmount: "5000.00",  maxAmount: "200000.00", earlyWithdrawalPenalty: "10.00", isActive: true },
    { name: "Premium", durationDays: 180, roiPercent: "25.00", minAmount: "20000.00", maxAmount: "500000.00", earlyWithdrawalPenalty: "10.00", isActive: true },
  ];

  for (const plan of plans) {
    await db.insert(stakingPlansTable).values(plan).onConflictDoNothing();
  }
  console.log(`Seeded ${plans.length} staking plans`);

  const settings = [
    { key: "payhero_username",       value: "" },
    { key: "payhero_password",       value: "" },
    { key: "payhero_channel_id",     value: "" },
    { key: "tier1_referral_percent", value: "5" },
    { key: "tier2_referral_percent", value: "2" },
  ];

  for (const s of settings) {
    await db.insert(platformSettingsTable).values(s).onConflictDoNothing();
  }
  console.log(`Seeded default platform settings`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
