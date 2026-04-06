import { db } from "db";

export const CREDIT_COSTS = {
  ANALYZE_PROMPT: 1,
  EVALUATE_PROMPT: 2, // Evaluation is more expensive (multiple test cases)
};

export const DAILY_CREDIT_RESET_LIMIT = 50;

/**
 * Checks if a user has enough credits for an action and deducts them.
 * Also handles daily credit refresh.
 */
export async function useCredits(userId: string, cost: number) {
  const profile = await db.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("User profile not found");
  }

  let currentCredits = profile.credits;
  const now = new Date();
  const lastRefresh = profile.lastCreditRefresh
    ? new Date(profile.lastCreditRefresh)
    : now;

  // Daily refresh logic: If last refresh was on a previous day
  const isDifferentDay =
    now.getUTCFullYear() !== lastRefresh.getUTCFullYear() ||
    now.getUTCMonth() !== lastRefresh.getUTCMonth() ||
    now.getUTCDate() !== lastRefresh.getUTCDate();

  if (isDifferentDay) {
    currentCredits = DAILY_CREDIT_RESET_LIMIT;
    // Update the profile with refreshed credits and new timestamp
    await db.userProfile.update({
      where: { userId },
      data: {
        credits: currentCredits,
        lastCreditRefresh: now,
      },
    });
  }

  if (currentCredits < cost) {
    return { allowed: false, remaining: currentCredits };
  }

  const updatedProfile = await db.userProfile.update({
    where: { userId },
    data: {
      credits: {
        decrement: cost,
      },
    },
  });

  return { allowed: true, remaining: updatedProfile.credits };
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
