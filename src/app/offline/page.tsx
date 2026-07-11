import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="container mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <WifiOff className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Estás sin conexión
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        No pudimos cargar este contenido. Revisa tu conexión a internet. El
        contenido que ya habías visto puede seguir disponible.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/popular">Reintentar</Link>
        </Button>
      </div>
    </main>
  );
}
