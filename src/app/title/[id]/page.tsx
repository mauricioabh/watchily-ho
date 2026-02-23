import { notFound } from "next/navigation";
import Image from "next/image";
import { getTitleDetails } from "@/lib/streaming/unified";
import { TitleActions } from "@/components/title-actions";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import { TbBrandDisney, TbBrandHbo, TbBrandNetflix } from "react-icons/tb";
import { SiAppletv, SiCrunchyroll, SiPrimevideo, SiParamountplus } from "react-icons/si";
import type { StreamingSource } from "@/types/streaming";
import type { ComponentType } from "react";

/* ── Platform icon helper ── */
type IconComponent = ComponentType<{ className?: string; style?: React.CSSProperties }>;
interface PlatformDef { Icon: IconComponent; color: string }
const PLATFORMS: [RegExp, PlatformDef][] = [
  [/netflix/i,           { Icon: TbBrandNetflix,  color: "#E50914" }],
  [/disney/i,            { Icon: TbBrandDisney,   color: "#113CCF" }],
  [/\b(hbo|max)\b/i,     { Icon: TbBrandHbo,      color: "#B535F6" }],
  [/\b(prime|amazon)\b/i,{ Icon: SiPrimevideo,    color: "#00A8E1" }],
  [/apple/i,             { Icon: SiAppletv,        color: "#FFFFFF" }],
  [/crunchyroll/i,       { Icon: SiCrunchyroll,   color: "#F47521" }],
  [/paramount/i,         { Icon: SiParamountplus, color: "#0064FF" }],
];
function getPlatformDef(name: string): PlatformDef | null {
  for (const [re, def] of PLATFORMS) if (re.test(name)) return def;
  return null;
}

/* ── Source card ── */
function SourceCard({ s }: { s: StreamingSource }) {
  const def = getPlatformDef(s.providerName);
  const typeLabel =
    s.type === "sub" ? "Incluido" :
    s.type === "rent" ? "Alquiler" :
    s.type === "buy" ? "Compra" : "Gratis";

  return (
    <a
      href={s.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3 transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_16px_2px_rgba(59,130,246,0.15)]"
    >
      {def ? (
        <def.Icon className="size-6 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: def.color }} />
      ) : (
        <span className="size-5 shrink-0 rounded bg-white/20 text-[10px] text-center leading-5">
          {s.providerName.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{s.providerName}</p>
        <p className="text-xs text-muted-foreground">
          {typeLabel}
          {s.quality ? ` · ${s.quality}` : ""}
          {s.price != null ? ` · $${s.price}` : ""}
        </p>
      </div>
    </a>
  );
}

/* ── Score badge ── */
function ScoreBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/10 bg-card/60 px-4 py-3 text-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-1 text-2xl font-bold" style={{ color }}>{value}</span>
    </div>
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

  // Use user's saved country, fallback to region param or MX
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userCountry = region ?? "MX";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("country_code").eq("id", user.id).single();
    if (profile?.country_code) userCountry = profile.country_code;
  }

  const title = await getTitleDetails(id, { region: userCountry, country: userCountry });
  if (!title) notFound();

  const posterUrl = title.poster?.startsWith("http") ? title.poster : undefined;
  const backdropUrl = title.backdrop?.startsWith("http") ? title.backdrop : undefined;

  // Deduplicate sources by provider+type
  const seen = new Set<string>();
  const uniqueSources = (title.sources ?? []).filter((s) => {
    const key = `${s.providerName}-${s.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const subSources = uniqueSources.filter((s) => s.type === "sub");
  const paidSources = uniqueSources.filter((s) => s.type !== "sub");

  return (
    <main>
      {/* Hero with backdrop */}
      <div className="relative">
        {backdropUrl && (
          <div className="pointer-events-none absolute inset-0 h-80 overflow-hidden">
            <Image
              src={backdropUrl}
              alt=""
              fill
              className="object-cover opacity-15"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/30 via-background/60 to-background" />
          </div>
        )}

        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6">
          <BackButton />

          <div className="mt-6 flex flex-col gap-6 md:flex-row">
            {/* Poster */}
            <div className="relative h-80 w-56 shrink-0 overflow-hidden rounded-xl bg-muted shadow-2xl md:h-96 md:w-64">
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
                <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
                  {title.name.slice(0, 2)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {title.type === "series" && (
                    <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                      SERIE
                    </span>
                  )}
                  {title.year != null && <span>{title.year}</span>}
                  {title.runtime != null && <span>{title.runtime} min</span>}
                  {title.genres?.length ? <span>{title.genres.slice(0, 3).join(" · ")}</span> : null}
                </div>
                <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{title.name}</h1>
                {title.originalName && title.originalName !== title.name && (
                  <p className="mt-1 text-sm text-muted-foreground">{title.originalName}</p>
                )}
              </div>

              {/* Score badges */}
              {(title.imdbRating != null || title.userRating != null || title.criticScore != null || title.rottenTomatoesRating != null) && (
                <div className="flex flex-wrap gap-3">
                  {title.imdbRating != null && (
                    <ScoreBadge label="IMDb" value={title.imdbRating.toFixed(1)} color="#f5c518" />
                  )}
                  {title.userRating != null && (
                    <ScoreBadge label="Usuario" value={title.userRating.toFixed(1)} color="#60a5fa" />
                  )}
                  {title.criticScore != null && (
                    <ScoreBadge label="Crítica" value={`${title.criticScore}%`} color={title.criticScore >= 60 ? "#4ade80" : "#f87171"} />
                  )}
                  {title.rottenTomatoesRating != null && (
                    <ScoreBadge label="RT" value={`${title.rottenTomatoesRating}%`} color={title.rottenTomatoesRating >= 60 ? "#f87171" : "#94a3b8"} />
                  )}
                </div>
              )}

              {/* Synopsis */}
              {title.overview && (
                <p className="max-w-2xl rounded-lg bg-black/30 px-4 py-3 text-sm leading-relaxed text-foreground/90 backdrop-blur-sm sm:text-base">
                  {title.overview}
                </p>
              )}

              {/* Actions (bookmark, like) */}
              <TitleActions titleId={title.id} titleType={title.type} titleName={title.name} />

              {/* Trailer link */}
              {title.trailer && (
                <a
                  href={title.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
                >
                  ▶ Ver tráiler
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streaming sources */}
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {subSources.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Disponible con suscripción</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subSources.map((s, i) => <SourceCard key={i} s={s} />)}
            </div>
          </section>
        )}

        {paidSources.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Alquiler / Compra</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {paidSources.map((s, i) => <SourceCard key={i} s={s} />)}
            </div>
          </section>
        )}

        {uniqueSources.length === 0 && (
          <p className="text-muted-foreground">
            No hay fuentes de streaming disponibles para esta región.
          </p>
        )}
      </div>
    </main>
  );
}
