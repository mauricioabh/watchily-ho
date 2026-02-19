import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  const provider = user.app_metadata?.provider ?? "email";

  return (
    <main className="container max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <div className="mt-6 space-y-6 rounded-lg border border-border bg-card p-6">
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Iniciaste sesión con</p>
          <p className="font-medium">{provider === "google" ? "Google" : "Email y contraseña"}</p>
        </div>
        <SettingsForm
          initialCountry={profile?.country_code ?? "US"}
          initialProviderIds={selectedProviderIds}
        />
        <Link href="/">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
      </div>
    </main>
  );
}
