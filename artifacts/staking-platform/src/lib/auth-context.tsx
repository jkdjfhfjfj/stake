import { createContext, useContext } from "react";
import { useUser } from "@clerk/react";

export interface AppUser {
  firstName: string | null;
  email: string;
}

interface AuthCtx {
  user: AppUser;
  devMode: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: { firstName: "Dev", email: "dev@stakeke.local" },
  devMode: false,
});

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: { firstName: "Dev", email: "dev@stakeke.local" }, devMode: true }}>
      {children}
    </AuthContext.Provider>
  );
}

function ClerkUserBridge({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const appUser: AppUser = {
    firstName: user?.firstName ?? null,
    email: user?.emailAddresses[0]?.emailAddress ?? "",
  };
  return (
    <AuthContext.Provider value={{ user: appUser, devMode: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  return <ClerkUserBridge>{children}</ClerkUserBridge>;
}

export function useAppUser(): AppUser {
  return useContext(AuthContext).user;
}

export function useDevMode(): boolean {
  return useContext(AuthContext).devMode;
}
