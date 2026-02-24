import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, country_code")
    .eq("id", user.id)
    .single();

  const { data: providerRows } = await supabase
    .from("user_providers")
    .select("provider_id")
    .eq("user_id", user.id);
  const selectedProviderIds = (providerRows ?? []).map((r) => r.provider_id);

  const defaultCountry = profile?.country_code ?? "MX";
  const needsOnboarding = !profile?.country_code || selectedProviderIds.length === 0;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-center text-2xl font-bold tracking-tight">Configuración</h1>
      <div className="mt-6 space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Iniciaste sesión con</p>
          <p className="font-medium">{provider === "google" ? "Google" : "Email y contraseña"}</p>
        </div>
        <SettingsForm
          initialCountry={defaultCountry}
          initialProviderIds={selectedProviderIds}
          redirectOnSave={needsOnboarding}
        />
      </div>
    </main>
  );
}
