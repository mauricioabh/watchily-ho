import Link from "next/link";
import { getPopularTitles } from "@/lib/streaming/unified";
import { TitleTile } from "@/components/title-tile";
import { Suspense } from "react";

async function TVPopular() {
  const movies = await getPopularTitles({ type: "movie" });
  const series = await getPopularTitles({ type: "series" });
  const combined = [...movies, ...series].slice(0, 16);
  return (
    <div className="grid grid-cols-4 gap-6">
      {combined.map((title) => (
        <div key={title.id} className="focusable-tv focus:outline focus:outline-2 focus:outline-primary">
          <Link href={`/title/${title.id}?device=tv`} className="block">
            <TitleTile title={title} />
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function TVPage() {
  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Watchily</h1>
      <nav className="mb-8 flex gap-4">
        <Link
          href="/tv"
          className="rounded bg-primary px-4 py-2 text-primary-foreground focus:outline focus:outline-2 focus:outline-primary"
        >
          Inicio
        </Link>
        <Link
          href="/search?device=tv"
          className="rounded border border-border px-4 py-2 focus:outline focus:outline-2 focus:outline-primary"
        >
          Buscar
        </Link>
      </nav>
      <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
        <TVPopular />
      </Suspense>
    </main>
  );
}
