import { env } from "@/env";

export const CREDIT_COSTS = {
  ANALYZE_PROMPT: 1,
  EVALUATE_PROMPT: 2,
};

export const DAILY_CREDIT_RESET_LIMIT = 50;

interface CreditDeductionResult {
  allowed: boolean;
  remaining: number;
}

interface UserCredits {
  credits: number;
}

interface BackendProfile {
  credits: number;
}

export async function deductCredits(
  userId: string,
  cost: number,
): Promise<CreditDeductionResult> {
  try {
    const response = await fetch(
      `${env.BACKEND_URL}/profiles/${userId}/deduct?amount=${cost}`,
      { method: "POST" },
    );

    if (!response.ok) {
      throw new Error("Failed to deduct credits from backend");
    }

    return (await response.json()) as CreditDeductionResult;
  } catch (error) {
    console.error("Deduct credits error:", error);
    return { allowed: false, remaining: 0 };
  }
}

export async function getUserCredits(
  userId: string,
): Promise<UserCredits> {
  try {
    const response = await fetch(
      `${env.BACKEND_URL}/profiles/${userId}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return { credits: 0 };
    }

    const profile = (await response.json()) as BackendProfile;
    return { credits: profile.credits };
  } catch (error) {
    console.error("Get user credits error:", error);
    return { credits: 0 };
  }
}
