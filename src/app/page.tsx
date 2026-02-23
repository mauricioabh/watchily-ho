import { redirect } from "next/navigation";
import { AnimatedSection } from "@/components/animated-section";
import { createClient } from "@/lib/supabase/server";
import { AuthInlineCard } from "@/components/auth-inline-card";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/popular");

  return (
    <main>
      <AnimatedSection>
        <section className="relative py-14 sm:py-20">
          <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Encuentra en qué plataforma ver cada título
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Inicia sesión y personaliza tus servicios para obtener resultados ajustados a tus plataformas.
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <AuthInlineCard />
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
