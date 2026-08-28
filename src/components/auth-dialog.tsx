"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localizedPath } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { captureProductEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AuthDialog({
  triggerLabel,
  triggerClassName,
}: {
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkOnboardingAndRedirect = async () => {
    try {
      const onboardingRes = await fetch("/api/profile/onboarding");
      if (onboardingRes.ok) {
        const onboarding = await onboardingRes.json();
        if (onboarding.needsOnboarding) {
          window.location.href = `${localizedPath("/settings", locale)}?onboarding=1`;
          return;
        }
      }
    } catch {
      // ignore and fallback
    }
    window.location.href = localizedPath("/", locale);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      captureProductEvent("auth_completed", {
        method: "google",
        flow: "sign_in",
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
      setMessage(error.message);
      return;
    }
    captureProductEvent("auth_completed", { method: "email", flow: "sign_in" });
    setOpen(false);
    await checkOnboardingAndRedirect();
  };

  const handleEmailSignUp = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else {
      captureProductEvent("auth_completed", {
        method: "email",
        flow: "sign_up",
      });
      setMessage(t("checkEmail"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>
          {triggerLabel ?? t("signIn")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("signInWatchily")}</DialogTitle>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {t("continueWithGoogle")}
        </Button>
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <span className="relative flex justify-center text-xs uppercase text-muted-foreground">
            {t("orEmail")}
          </span>
        </div>
        <form className="space-y-4" onSubmit={handleEmailSignIn}>
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t("email")}</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">{t("password")}</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
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
      </DialogContent>
    </Dialog>
  );
}
