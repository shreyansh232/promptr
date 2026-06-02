import { env } from "@/env";

/**
 * Shared types for backend (FastAPI) API responses.
 * Keep in sync with `backend/schemas/`.
 */

export interface BattleTestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface BattleParticipant {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  prompt?: string | null;
  tokenCount?: number | null;
  score?: number | null;
  passed?: boolean | null;
  result?: "WIN" | "LOSS" | "DRAW" | null;
  eloChange?: number | null;
  submittedAt?: string | null;
}

export interface Battle {
  id: string;
  title: string;
  description: string;
  goal: string;
  testCases: BattleTestCase[];
  status: "WAITING" | "ACTIVE" | "COMPLETED";
  createdBy: string;
  opponentId?: string | null;
  participants: BattleParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBattleRequest {
  title: string;
  description: string;
  goal: string;
  testCases: BattleTestCase[];
}

export interface JoinBattleRequest {
  battleId: string;
}

export interface SubmitPromptRequest {
  battleId: string;
  prompt: string;
}

export interface TestCaseEvaluation {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface TestCaseEvaluationResult {
  overallScore: number;
  passed: boolean;
  results: Record<string, unknown>[];
  testCasesPassed?: number;
  testCasesTotal?: number;
}

/**
 * Typed fetch wrapper for the FastAPI backend.
 * Throws on non-2xx responses with a structured error.
 */
export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${env.BACKEND_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => undefined);
    }
    throw new BackendError(
      `Backend request failed: ${response.status} ${response.statusText}`,
      response.status,
      detail,
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
