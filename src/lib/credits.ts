import { db } from "db";

export const CREDIT_COSTS = {
  ANALYZE_PROMPT: 1,
  EVALUATE_PROMPT: 2, // Evaluation is more expensive (multiple test cases)
};

export const DAILY_CREDIT_RESET_LIMIT = 50;

/**
 * Checks if a user has enough credits for an action and deducts them.
 * Also handles daily credit refresh atomically.
 */
export async function deductCredits(userId: string, cost: number) {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  // 1. Atomic Refresh: Reset credits to DAILY_CREDIT_RESET_LIMIT if last refresh was before today
  await db.userProfile.updateMany({
    where: {
      userId,
      OR: [
        { lastCreditRefresh: { lt: startOfToday } },
        { lastCreditRefresh: null },
      ],
    },
    data: {
      credits: DAILY_CREDIT_RESET_LIMIT,
      lastCreditRefresh: new Date(),
    },
  });

  // 2. Atomic Decrement: Only decrement if current credits >= cost
  const updated = await db.userProfile.updateMany({
    where: {
      userId,
      credits: { gte: cost },
    },
    data: {
      credits: {
        decrement: cost,
      },
    },
  });

  // 3. Check if deduction was successful
  if (updated.count === 0) {
    const profile = await db.userProfile.findUnique({
      where: { userId },
      select: { credits: true },
    });

    if (!profile) {
      throw new Error("User profile not found");
    }

    return { allowed: false, remaining: profile.credits };
  }

  // 4. Fetch the new balance
  const after = await db.userProfile.findUnique({
    where: { userId },
    select: { credits: true },
  });

  return { allowed: true, remaining: after?.credits ?? 0 };
}

export async function getUserCredits(userId: string) {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { credits: true, lastCreditRefresh: true },
  });

  if (!profile) return { credits: 0 };

  const now = new Date();
  const lastRefresh = profile.lastCreditRefresh
    ? new Date(profile.lastCreditRefresh)
    : now;
  const isDifferentDay =
    now.getUTCFullYear() !== lastRefresh.getUTCFullYear() ||
    now.getUTCMonth() !== lastRefresh.getUTCMonth() ||
    now.getUTCDate() !== lastRefresh.getUTCDate();

  if (isDifferentDay) {
    return { credits: DAILY_CREDIT_RESET_LIMIT };
  }

  return { credits: profile.credits };
}
