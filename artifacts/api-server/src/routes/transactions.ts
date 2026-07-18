import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, transactionsTable, usersTable, platformSettingsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { initiateSTKPush } from "../lib/payhero";
import { createNotification } from "../lib/notifications";
import {
  ListTransactionsResponse,
  InitiateDepositBody,
  InitiateDepositResponse,
  RequestWithdrawalBody,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

function getCallbackBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;
  return "http://localhost:8080";
}

/** Load platform limits from DB, falling back to safe defaults. */
async function getLimits() {
  const rows = await db.select().from(platformSettingsTable);
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    minDeposit:    Number(m["min_deposit"]    ?? "10"),
    maxDeposit:    Number(m["max_deposit"]    ?? "150000"),
    minWithdrawal: Number(m["min_withdrawal"] ?? "100"),
    maxWithdrawal: Number(m["max_withdrawal"] ?? "150000"),
  };
}

const router = Router();

function parseTransaction(t: typeof transactionsTable.$inferSelect) {
  return {
    ...t,
    amount: Number(t.amount),
    externalReference: t.externalReference ?? null,
    payheroRef: t.payheroRef ?? null,
  };
}

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.userId!))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(100);
  res.json(ListTransactionsResponse.parse(txs.map(parseTransaction)));
});

router.post("/transactions/deposit", requireAuth, async (req, res): Promise<void> => {
  const parsed = InitiateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, phoneNumber } = parsed.data;

  const { minDeposit, maxDeposit } = await getLimits();

  if (amount < minDeposit) {
    res.status(400).json({ error: `Minimum deposit is KES ${minDeposit.toLocaleString("en-KE")}` });
    return;
  }
  if (amount > maxDeposit) {
    res.status(400).json({ error: `Maximum deposit is KES ${maxDeposit.toLocaleString("en-KE")}` });
    return;
  }

  const externalReference = `DEP-${nanoid(12).toUpperCase()}`;

  // Create pending transaction first
  await db.insert(transactionsTable).values({
    userId: req.userId!,
    type: "DEPOSIT",
    amount: amount.toString(),
    status: "PENDING",
    description: `M-Pesa deposit via STK Push`,
    externalReference,
    phoneNumber,
  });

  const callbackUrl = `${getCallbackBaseUrl()}/api/webhooks/payhero`;

  try {
    await initiateSTKPush({
      amount,
      phoneNumber,
      reference: externalReference,
      description: "Staking Platform Deposit",
      callbackUrl,
    });

    res.json(InitiateDepositResponse.parse({
      success: true,
      message: "STK Push sent. Enter your M-Pesa PIN to complete.",
      externalReference,
    }));
  } catch (err: any) {
    // Update tx to failed
    await db.update(transactionsTable)
      .set({ status: "FAILED" })
      .where(eq(transactionsTable.externalReference, externalReference));

    res.status(502).json({ error: err.message ?? "STK push failed" });
  }
});

// Poll deposit status by externalReference — used by the frontend after STK Push
router.get("/transactions/status/:reference", requireAuth, async (req, res): Promise<void> => {
  const reference = String(req.params.reference);
  const tx = await db.query.transactionsTable.findFirst({
    where: eq(transactionsTable.externalReference, reference),
  });

  if (!tx || tx.userId !== req.userId!) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json({
    status: tx.status,
    amount: Number(tx.amount),
    type: tx.type,
    createdAt: tx.createdAt.toISOString(),
  });
});

router.post("/transactions/withdraw", requireAuth, async (req, res): Promise<void> => {
  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, phoneNumber } = parsed.data;
  const user = req.dbUser!;

  const { minWithdrawal, maxWithdrawal } = await getLimits();

  if (amount < minWithdrawal) {
    res.status(400).json({ error: `Minimum withdrawal is KES ${minWithdrawal.toLocaleString("en-KE")}` });
    return;
  }
  if (amount > maxWithdrawal) {
    res.status(400).json({ error: `Maximum withdrawal is KES ${maxWithdrawal.toLocaleString("en-KE")}` });
    return;
  }

  if (Number(user.availableBalance) < amount) {
    res.status(400).json({ error: "Insufficient available balance" });
    return;
  }

  const externalReference = `WIT-${nanoid(12).toUpperCase()}`;

  // Deduct from balance + create pending withdrawal atomically
  const [tx] = await db.transaction(async (trx) => {
    await trx.update(usersTable)
      .set({ availableBalance: (Number(user.availableBalance) - amount).toFixed(2) })
      .where(eq(usersTable.id, req.userId!));

    return trx.insert(transactionsTable).values({
      userId: req.userId!,
      type: "WITHDRAWAL",
      amount: amount.toString(),
      status: "PENDING",
      description: `Withdrawal to ${phoneNumber}`,
      externalReference,
      phoneNumber,
    }).returning();
  });

  res.status(201).json(parseTransaction(tx));
});

export default router;
