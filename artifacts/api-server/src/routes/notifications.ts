import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { ListNotificationsResponse, MarkNotificationReadParams, MarkNotificationReadResponse } from "@workspace/api-zod";

const router = Router();

function parseNotif(n: typeof notificationsTable.$inferSelect) {
  return { ...n };
}

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifs = await db.query.notificationsTable.findMany({
    where: eq(notificationsTable.userId, req.userId!),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 50,
  });
  res.json(ListNotificationsResponse.parse(notifs.map(parseNotif)));
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, req.userId!)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(parseNotif(updated)));
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.userId!));
  res.json({ ok: true });
});

export default router;
