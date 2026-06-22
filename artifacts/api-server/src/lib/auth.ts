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

const DEV_CLERK_ID = "dev_local_user";

async function resolveUser(req: Request, res: Response, clerkId: string, email: string): Promise<boolean> {
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });

  if (!user) {
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
    return false;
  }

  req.userId = user.id;
  req.dbUser = user;
  return true;
}

const DEV_MODE = process.env.NODE_ENV === "development" && !process.env.CLERK_SECRET_KEY;

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Dev-mode: only accept dev-token; skip Clerk entirely (middleware not applied)
  if (DEV_MODE) {
    const authHeader = req.headers.authorization ?? "";
    if (authHeader === "Bearer dev-token") {
      const ok = await resolveUser(req, res, DEV_CLERK_ID, "dev@stakeke.local");
      if (ok) next();
      return;
    }
    res.status(401).json({ error: "Unauthorized — dev mode requires Bearer dev-token" });
    return;
  }

  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email = (auth as any)?.sessionClaims?.email as string | undefined ?? `${clerkId}@unknown.com`;
  const ok = await resolveUser(req, res, clerkId, email);
  if (ok) next();
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
