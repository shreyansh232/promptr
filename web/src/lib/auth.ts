import { cookies } from "next/headers";
import { backendFetch } from "./backend";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface Session {
  user: User;
}

export async function auth(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const user = await backendFetch<User>("/api/auth/users/me");
    if (user) {
      return { user };
    }
    return null;
  } catch (error) {
    console.error("Auth check failed:", error);
    return null;
  }
}
