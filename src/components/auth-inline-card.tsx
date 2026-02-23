"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthInlineCard() {
  const supabase = createClient();
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
          window.location.href = "/settings?onboarding=1";
          return;
        }
      }
    } catch {
      // fallback below
    }
    window.location.href = "/";
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
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
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
    else setMessage("Revisa tu correo para confirmar la cuenta.");
  };

  return (
    <div className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-card/70 p-5">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <FcGoogle className="size-5" aria-hidden />
        Continuar con Google
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative mx-auto flex w-fit justify-center bg-card/70 px-2 text-xs uppercase text-muted-foreground">
          o con email
        </span>
      </div>
      <form className="space-y-3" onSubmit={handleEmailSignIn}>
        <div className="space-y-1.5 text-left">
          <Label htmlFor="home-email">Email</Label>
          <Input
            id="home-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5 text-left">
          <Label htmlFor="home-password">Contraseña</Label>
          <Input
            id="home-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={loading}>
            Entrar
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={handleEmailSignUp} disabled={loading}>
            Registrarse
          </Button>
        </div>
      </form>
    </div>
  );
}

