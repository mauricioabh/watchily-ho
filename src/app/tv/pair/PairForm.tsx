"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PairForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      setMessage({ type: "error", text: "El código debe tener 6 dígitos" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/pair/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Error al vincular" });
        return;
      }

      setMessage({ type: "success", text: "¡Listo! Tu TV ya está vinculada." });
      setCode("");
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código</Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="text-center text-2xl tracking-[0.5em] font-mono"
          autoComplete="one-time-code"
        />
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.type === "error" ? "text-destructive" : "text-green-600 dark:text-green-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Vinculando…" : "Vincular TV"}
      </Button>
    </form>
  );
}
