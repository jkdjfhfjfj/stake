import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { createNotification } from "../lib/notifications";
import { logger } from "../lib/logger";

const router = Router();

router.post("/webhooks/payhero", async (req, res): Promise<void> => {
  const payload = req.body as {
    reference?: string;
    status?: string;
    amount?: number;
    phone?: string;
    merchantRef?: string;
  };

  const reference = payload.reference || payload.merchantRef;
  const status = payload.status?.toLowerCase();

  logger.info({ reference, status }, "PayHero webhook received");

  if (!reference) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  const tx = await db.query.transactionsTable.findFirst({
    where: eq(transactionsTable.externalReference, reference),
  });

  if (!tx) {
    logger.warn({ reference }, "Transaction not found for webhook");
    res.json({ received: true });
    return;
  }

  if (tx.status !== "PENDING") {
    res.json({ received: true });
    return;
  }

  if (status === "success" || status === "completed") {
    await db.transaction(async (trx) => {
      await trx.update(transactionsTable)
        .set({ status: "COMPLETED", payheroRef: reference })
        .where(eq(transactionsTable.externalReference, reference));

      if (tx.type === "DEPOSIT") {
        const user = await trx.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
        if (user) {
          await trx.update(usersTable)
            .set({ availableBalance: (Number(user.availableBalance) + Number(tx.amount)).toFixed(2) })
            .where(eq(usersTable.id, tx.userId));
        }
      }
    });

    if (tx.type === "DEPOSIT") {
      await createNotification({
        userId: tx.userId,
        type: "DEPOSIT",
        title: "Deposit Successful",
        message: `KES ${Number(tx.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })} has been credited to your account.`,
      });
    }
  } else if (status === "failed" || status === "cancelled") {
    await db.update(transactionsTable)
      .set({ status: "FAILED" })
      .where(eq(transactionsTable.externalReference, reference));

    // Refund balance if withdrawal failed
    if (tx.type === "WITHDRAWAL") {
      const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, tx.userId) });
      if (user) {
        await db.update(usersTable)
          .set({ availableBalance: (Number(user.availableBalance) + Number(tx.amount)).toFixed(2) })
          .where(eq(usersTable.id, tx.userId));
      }
    }
  }

  res.json({ received: true });
});

export default router;
