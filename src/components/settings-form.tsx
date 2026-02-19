"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROVIDERS = [
  { id: "netflix", name: "Netflix" },
  { id: "disney_plus", name: "Disney+" },
  { id: "hbo_max", name: "HBO Max" },
  { id: "amazon_prime", name: "Amazon Prime Video" },
  { id: "apple_tv_plus", name: "Apple TV+" },
  { id: "hulu", name: "Hulu" },
  { id: "paramount_plus", name: "Paramount+" },
  { id: "peacock", name: "Peacock" },
  { id: "star_plus", name: "Star+" },
  { id: "movistar_plus", name: "Movistar+" },
];

const COUNTRIES = [
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "BR", name: "Brasil" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemania" },
  { code: "FR", name: "Francia" },
];

export function SettingsForm({
  initialCountry,
  initialProviderIds,
}: {
  initialCountry: string;
  initialProviderIds: string[];
}) {
  const [country, setCountry] = useState(initialCountry);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialProviderIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCountry(initialCountry);
    setSelectedIds(new Set(initialProviderIds));
  }, [initialCountry, initialProviderIds]);

  const toggleProvider = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country_code: country }),
        }),
        fetch("/api/profile/providers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerIds: Array.from(selectedIds) }),
        }),
      ]);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>País (para disponibilidad de streaming)</Label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Proveedores (plataformas que tienes)</Label>
        <p className="text-sm text-muted-foreground">
          Selecciona las plataformas a las que estás suscrito para ver dónde puedes ver cada título.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(p.id)}
                onChange={() => toggleProvider(p.id)}
                className="h-4 w-4 rounded border-input"
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar"}
      </Button>
      {saved && <p className="text-sm text-primary">Guardado.</p>}
    </div>
  );
}
