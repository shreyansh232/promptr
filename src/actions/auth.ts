"use server";

import { signIn, signOut } from "auth";
import { db } from "db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

const AuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

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

  const validatedFields = AuthSchema.pick({ email: true, password: true }).safeParse({
    email,
    password,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0]?.message ?? "Invalid input" };
  }

  const { email: normalizedEmail, password: normalizedPassword } = validatedFields.data;

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

  const validatedFields = AuthSchema.safeParse({
    email,
    password,
    name,
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.errors[0]?.message ?? "Invalid input");
  }

  const { email: normalizedEmail, password: normalizedPassword, name: normalizedName } = validatedFields.data;

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  await db.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      hashedPassword: await hash(normalizedPassword, 10),
      // UserProfile will be created by the backend or via an event/hook
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
