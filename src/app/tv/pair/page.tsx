import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PairForm } from "./PairForm";

export default async function TVPairPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tv/pair");
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Vincular TV</h1>
        <p className="mt-2 text-muted-foreground">
          Introduce el c&oacute;digo de 6 d&iacute;gitos que ves en tu TV.
        </p>
        <PairForm />
      </div>
    </main>
  );
}
