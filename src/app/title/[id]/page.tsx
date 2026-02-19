import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTitleDetails } from "@/lib/streaming/unified";
import { TitleActions } from "@/components/title-actions";
import { Button } from "@/components/ui/button";
import type { StreamingSource } from "@/types/streaming";

function SourceChip({ s }: { s: StreamingSource }) {
  const label =
    s.type === "sub"
      ? "Suscripción"
      : s.type === "rent"
        ? `Alquiler ${s.price != null && s.currency ? `${s.currency} ${s.price}` : ""}`
        : s.type === "buy"
          ? `Compra ${s.price != null && s.currency ? `${s.currency} ${s.price}` : ""}`
          : "Gratis";
  return (
    <a
      href={s.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
    >
      <span className="font-medium">{s.providerName}</span>
      <span className="text-muted-foreground">{label}</span>
      {s.quality && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.quality}</span>
      )}
    </a>
  );
}

export default async function TitlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  const { id } = await params;
  const { region } = await searchParams;
  const title = await getTitleDetails(id, { region, country: region ?? "US" });
  if (!title) notFound();

  const posterUrl = title.poster?.startsWith("http") ? title.poster : undefined;

  return (
    <main className="min-h-screen">
      <div className="border-b border-border bg-card/30">
        <div className="container px-4 py-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver
          </Link>
          <div className="mt-4 flex flex-col gap-6 md:flex-row">
            <div className="relative h-[400px] w-full shrink-0 overflow-hidden rounded-lg bg-muted md:w-72">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={title.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                  {title.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{title.name}</h1>
                {title.originalName && title.originalName !== title.name && (
                  <p className="text-muted-foreground">Título original: {title.originalName}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  {title.year != null && <span>{title.year}</span>}
                  {title.type === "series" && (
                    <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground">
                      Serie
                    </span>
                  )}
                  {title.runtime != null && <span>{title.runtime} min</span>}
                  {title.imdbRating != null && (
                    <span className="font-medium">IMDb {title.imdbRating.toFixed(1)}</span>
                  )}
                  {title.rottenTomatoesRating != null && (
                    <span>{title.rottenTomatoesRating}%</span>
                  )}
                </div>
              </div>
              <TitleActions titleId={title.id} titleType={title.type} titleName={title.name} />
              {title.overview && (
                <div>
                  <h2 className="text-lg font-semibold">Sinopsis</h2>
                  <p className="text-muted-foreground">{title.overview}</p>
                </div>
              )}
              {title.genres?.length ? (
                <p className="text-sm text-muted-foreground">
                  Géneros: {title.genres.join(", ")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold">Dónde ver</h2>
        {title.sources && title.sources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {title.sources.map((s, i) => (
              <SourceChip key={`${s.providerId}-${s.type}-${i}`} s={s} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No hay fuentes de streaming disponibles para esta región. Prueba cambiando el país en
            configuración.
          </p>
        )}
      </div>
    </main>
  );
}
