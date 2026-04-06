"use server";

import { signIn, signOut } from "auth";
import { db } from "db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const login = async (provider: string) => {
  await signIn(provider, { redirectTo: "/" });
  revalidatePath("/");
};

export const logout = async () => {
  await signOut({ redirectTo: "/" });
  revalidatePath("/");
};

export const loginWithCreds = async (
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> => {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Please provide both email and password" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    return { error: "Please provide both email and password" };
  }

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password: normalizedPassword,
      redirect: true,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Something went wrong during sign in" };
      }
    }

    // Re-throw the error so Next.js can handle redirects (which are technically errors)
    throw error;
  }
};

export const registerWithCreds = async (formData: FormData): Promise<void> => {
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof name !== "string"
  ) {
    throw new Error("Please complete all required fields");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const normalizedName = name.trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedName) {
    throw new Error("Please complete all required fields");
  }

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  await db.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      hashedPassword: await hash(normalizedPassword, 10),
      profile: {
        create: {
          level: "beginner",
          expertise: "general",
          learningStyle: "visual",
          goals: [],
        },
      },
    },
  });

  await signIn("credentials", {
    email: normalizedEmail,
    password: normalizedPassword,
    redirect: true,
    redirectTo: "/dashboard",
  });

  revalidatePath("/");
};
