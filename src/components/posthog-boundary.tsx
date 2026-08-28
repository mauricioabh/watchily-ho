"use client";

import type { ReactNode } from "react";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import {
  initializePostHog,
  isPostHogConfigured,
  syncPostHogIdentity,
} from "@/lib/analytics";

export function PostHogBoundary({ children }: { children: ReactNode }) {
  const enabled =
    typeof window !== "undefined" &&
    isPostHogConfigured() &&
    initializePostHog();

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) syncPostHogIdentity(user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncPostHogIdentity(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [enabled]);

  if (!enabled) return children;

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
