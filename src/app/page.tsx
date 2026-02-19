import Link from "next/link";
import { Suspense } from "react";
import { getPopularTitles } from "@/lib/streaming/unified";
import { TitleTile } from "@/components/title-tile";
import { Button } from "@/components/ui/button";

async function PopularSection() {
  const [movies, series] = await Promise.all([
    getPopularTitles({ type: "movie" }),
    getPopularTitles({ type: "series" }),
  ]);
  const combined = [...movies, ...series].slice(0, 24);

  return (
    <section className="container px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Películas y series más populares</h2>
      {combined.length === 0 ? (
        <p className="text-muted-foreground">
          Configura WATCHMODE_API_KEY en .env.local para ver títulos populares. Mientras tanto,
          usa la búsqueda.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {combined.map((title) => (
            <TitleTile key={title.id} title={title} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <section className="border-b border-border bg-card/50 py-12">
        <div className="container px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Dónde ver películas y series
          </h1>
          <p className="mt-2 text-muted-foreground">
            Busca títulos y descubre en qué plataformas están disponibles.
          </p>
          <Link href="/search">
            <Button className="mt-4">Buscar</Button>
          </Link>
        </div>
      </section>
      <Suspense fallback={<div className="container px-4 py-8">Cargando...</div>}>
        <PopularSection />
      </Suspense>
    </main>
  );
}
