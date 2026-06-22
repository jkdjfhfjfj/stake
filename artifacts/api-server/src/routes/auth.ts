import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { nanoid } from "nanoid";
import { signToken, requireAuth } from "../lib/auth";

const router = Router();

// ── Register ───────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, referralCode } = req.body as {
    email?: string;
    password?: string;
    referralCode?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const myReferralCode = nanoid(8).toUpperCase();

  // Validate referral code if provided
  let referredBy: string | undefined;
  if (referralCode) {
    const referrer = await db.query.usersTable.findFirst({ where: eq(usersTable.referralCode, referralCode.toUpperCase()) });
    if (referrer) referredBy = referralCode.toUpperCase();
  }

  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    referralCode: myReferralCode,
    referredBy,
  }).returning();

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: sanitize(user) });
});

// ── Login ──────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.isLocked) {
    res.status(403).json({ error: "Account locked. Contact support." });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: sanitize(user) });
});

// ── Me ─────────────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, (req, res): void => {
  res.json(sanitize(req.dbUser!));
});

function sanitize(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _, clerkId: __, ...safe } = user;
  return {
    ...safe,
    availableBalance: Number(safe.availableBalance),
    totalEarnings: Number(safe.totalEarnings),
    referralRewards: Number(safe.referralRewards),
  };
}

export default router;
