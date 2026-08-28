"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { localizedPath } from "@/i18n/routing";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";
import { captureProductEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("auth");
  const next = searchParams.get("next") ?? localizedPath("/popular", locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else {
      captureProductEvent("auth_completed", {
        method: "google",
        flow: "sign_in",
      });
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      captureProductEvent("auth_completed", {
        method: "email",
        flow: "sign_up",
      });
      setMessage({
        type: "success",
        text: t("checkEmail"),
      });
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    captureProductEvent("auth_completed", { method: "email", flow: "sign_in" });

    try {
      const onboardingRes = await fetch("/api/profile/onboarding");
      if (onboardingRes.ok) {
        const onboarding = await onboardingRes.json();
        if (onboarding.needsOnboarding) {
          window.location.href = "/settings?onboarding=1";
          return;
        }
      }
    } catch {
      // Fallback to home if onboarding status can't be checked.
    }

    window.location.href = next;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Watchily</h1>
          <p className="text-muted-foreground text-sm">
            {t("signInToContinue")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <FcGoogle className="size-5" aria-hidden />
          {t("continueWithGoogle")}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <span className="relative flex justify-center text-xs uppercase text-muted-foreground">
            {t("orEmail")}
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleEmailSignIn}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {message && (
            <p
              className={`text-sm ${message.type === "error" ? "text-destructive" : "text-primary"}`}
            >
              {message.text}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {t("signIn")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={loading}
              onClick={handleEmailSignUp}
            >
              {t("signUp")}
            </Button>
          </div>
        </form>

        <p className="text-center text-muted-foreground text-xs">
          <Link href="/" className="underline hover:text-foreground">
            {t("backHome")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
