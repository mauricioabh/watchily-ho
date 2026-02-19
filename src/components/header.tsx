import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Search, LogOut, Settings } from "lucide-react";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          Watchily
        </Link>
        <nav className="flex flex-1 items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Inicio
          </Link>
          <Link
            href="/popular"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Popular
          </Link>
          <Link
            href="/lists"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Listas
          </Link>
          <Link
            href="/search"
            className="ml-auto flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-4" />
            Buscar
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/settings">
                <Button variant="ghost" size="icon" title="Configuración">
                  <Settings className="size-4" />
                </Button>
              </Link>
              <form action="/auth/signout" method="post" className="inline">
                <Button variant="ghost" size="icon" type="submit" title="Cerrar sesión">
                  <LogOut className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default">Iniciar sesión</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
