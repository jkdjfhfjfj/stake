import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      dbUser?: typeof usersTable.$inferSelect;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // JIT provision user in DB
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });

  if (!user) {
    const email = (auth as any)?.sessionClaims?.email as string | undefined ?? `${clerkId}@unknown.com`;
    const referralCode = nanoid(8).toUpperCase();
    const [created] = await db.insert(usersTable).values({
      clerkId,
      email,
      referralCode,
    }).returning();
    user = created;
  }

  if (user.isLocked) {
    res.status(403).json({ error: "Account locked" });
    return;
  }

  req.userId = user.id;
  req.dbUser = user;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (req.dbUser?.role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
};
