import { db, notificationsTable } from "@workspace/db";

type NotificationType = "DEPOSIT" | "WITHDRAWAL_APPROVED" | "WITHDRAWAL_REJECTED" | "STAKE_MATURED" | "REFERRAL_EARNED" | "ADMIN_MESSAGE";

export async function createNotification(params: {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
}) {
  await db.insert(notificationsTable).values(params);
}
