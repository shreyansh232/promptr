"use server";

import { signIn, signOut } from "auth";
import { db } from "db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

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

export const loginWithCreds = async (formData: FormData): Promise<void> => {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error("Please provide both email and password");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Please provide both email and password");
  }

  await signIn("credentials", {
    email: normalizedEmail,
    password: normalizedPassword,
    redirect: true,
    redirectTo: "/dashboard",
  });

  revalidatePath("/");
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
