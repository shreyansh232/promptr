import { env } from "@/env";
import { cookies } from "next/headers";

/**
 * Shared types for backend (FastAPI) API responses.
 * Keep in sync with `backend/schemas/`.
 */

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
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
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
