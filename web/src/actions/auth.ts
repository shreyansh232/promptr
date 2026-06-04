"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cookies } from "next/headers";
import { env } from "@/env";

const AuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const login = async (provider: string) => {
  // Since we are not using next-auth, redirect to the FastAPI OAuth endpoints
  // However, Next.js server actions can't easily do client redirects directly unless using next/navigation's redirect.
  // We'll handle this in the client components directly by rendering an <a> tag to the backend.
};

export const logout = async () => {
  cookies().delete("access_token");
  revalidatePath("/");
};

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
    const res = await fetch(`${env.BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validatedFields.data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.detail || "Invalid credentials" };
    }

    const data = await res.json();
    cookies().set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
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

  const res = await fetch(`${env.BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedFields.data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed");
  }

  const data = await res.json();
  cookies().set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  revalidatePath("/");
};
