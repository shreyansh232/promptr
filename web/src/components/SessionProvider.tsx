"use client";

import React, { createContext, useContext } from "react";
import type { Session } from "@/lib/auth";

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const session = useContext(SessionContext);
  return { data: session, status: session ? "authenticated" : "unauthenticated" };
};
