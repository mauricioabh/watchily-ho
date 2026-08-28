"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { PostHogBoundary } from "@/components/posthog-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { createQueryClient } from "@/lib/query";

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

const AuthScopeContext = createContext<string | null | undefined>(undefined);

export function useAuthScope(): string | null | undefined {
  return useContext(AuthScopeContext);
}

function AuthQueryBoundary({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let currentUserId: string | null | undefined;
    let active = true;

    const applyUser = (nextUserId: string | null) => {
      if (!active) return;
      if (currentUserId !== undefined && currentUserId !== nextUserId) {
        queryClient.clear();
      }
      currentUserId = nextUserId;
      setUserId(nextUserId);
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      applyUser(user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <AuthScopeContext.Provider value={userId}>
      {children}
    </AuthScopeContext.Provider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthQueryBoundary>
          <NuqsAdapter>
            <PostHogBoundary>{children}</PostHogBoundary>
            <Toaster
              position="bottom-right"
              theme="dark"
              richColors
              closeButton
              toastOptions={{ duration: 4_000 }}
            />
          </NuqsAdapter>
        </AuthQueryBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
