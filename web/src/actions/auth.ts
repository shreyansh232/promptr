"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/env";

const AuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const login = async (_provider: string) => {
  // Since we are not using next-auth, redirect to the FastAPI OAuth endpoints
  // However, Next.js server actions can't easily do client redirects directly unless using next/navigation's redirect.
  // We'll handle this in the client components directly by rendering an <a> tag to the backend.
};

export const logout = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  // Blacklist the token on the backend before deleting it
  if (token) {
    try {
      await fetch(`${env.BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Fail-open: backend unreachable, still delete local cookie
    }
  }

  cookieStore.delete("access_token");
  revalidatePath("/");
};

interface LoginResponse {
  access_token: string;
  is_new?: boolean;
}

interface ErrorResponse {
  detail?: string;
}

export const loginWithCreds = async (
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> => {
  const email = formData.get("email");
  const password = formData.get("password");

  const validatedFields = AuthSchema.pick({
    email: true,
    password: true,
  }).safeParse({ email, password });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    const res = await fetch(`${env.BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validatedFields.data),
    });

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as ErrorResponse;
      return { error: errorData.detail ?? "Invalid credentials" };
    }

    const data = (await res.json()) as LoginResponse;
    cookies().set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    if (data.is_new) {
      redirect("/onboarding");
    } else {
      redirect("/");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login error:", error);
    return { error: "Something went wrong during sign in" };
  }
};

interface ExchangeCodeResponse {
  access_token: string;
  is_new?: boolean;
}

export const exchangeOAuthCode = async (
  code: string,
): Promise<{ error?: string; redirectTo?: string }> => {
  try {
    const res = await fetch(`${env.BACKEND_URL}/api/auth/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      return { error: "Failed to exchange OAuth code" };
    }

    const data = (await res.json()) as ExchangeCodeResponse;
    cookies().set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { redirectTo: data.is_new ? "/onboarding" : "/" };
  } catch (error) {
    console.error("OAuth code exchange error:", error);
    return { error: "Something went wrong during sign in" };
  }
};

export const registerWithCreds = async (formData: FormData): Promise<void> => {
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  const validatedFields = AuthSchema.safeParse({ email, password, name });

  if (!validatedFields.success) {
    throw new Error(
      validatedFields.error.errors[0]?.message ?? "Invalid input",
    );
  }

  const res = await fetch(`${env.BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedFields.data),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as ErrorResponse;
    throw new Error(errorData.detail ?? "Registration failed");
  }

  const data = (await res.json()) as LoginResponse;
  cookies().set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/onboarding");
};
