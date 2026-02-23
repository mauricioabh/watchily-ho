"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogOut, Settings, Film, Home, List, Layers } from "lucide-react";
import { TbBrandDisney, TbBrandHbo, TbBrandNetflix } from "react-icons/tb";
import { SiAppletv, SiCrunchyroll, SiPrimevideo } from "react-icons/si";
import type { User } from "@supabase/supabase-js";

const navItems: { href: string; label: string; icon: typeof Home }[] = [
  { href: "/popular", label: "Popular", icon: Film },
  { href: "/lists", label: "Listas", icon: List },
  { href: "/lists/all", label: "Ver todo", icon: Layers },
];

const HEADER_PLATFORMS = [
  { Icon: TbBrandNetflix, color: "#E50914", label: "Netflix" },
  { Icon: TbBrandDisney, color: "#113CCF", label: "Disney+" },
  { Icon: SiPrimevideo, color: "#00A8E1", label: "Prime Video" },
  { Icon: TbBrandHbo, color: "#B535F6", label: "HBO Max" },
  { Icon: SiCrunchyroll, color: "#F47521", label: "Crunchyroll" },
  { Icon: SiAppletv, color: "#FFFFFF", label: "Apple TV" },
] as const;

export function HeaderClient({ user }: { user: User | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (pathname === "/search" && searchParams.get("q"))
      setSearchQuery(searchParams.get("q") ?? "");
  }, [pathname, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  };

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-white/8 bg-linear-to-b from-zinc-900/95 to-background/98 backdrop-blur-md"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <Film className="size-5 text-primary" aria-hidden />
            Watchily
          </Link>
        </motion.div>

        {user ? (
          <>
            {/* Nav izquierda */}
            <nav className="flex items-center gap-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.08 + i * 0.04 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground"
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Búsqueda + acciones — empujado a la derecha */}
            <motion.div
              className="ml-auto flex items-center gap-2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2"
              >
                <Input
                  type="search"
                  placeholder="Películas o series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-52 rounded-lg border-white/10 bg-white/5 text-sm placeholder:text-muted-foreground focus-visible:ring-primary sm:w-72"
                  aria-label="Buscar"
                />
                <Button type="submit" variant="accent" size="sm" className="h-9 shrink-0 rounded-lg px-3">
                  <Search className="size-4" />
                  Buscar
                </Button>
              </form>
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
            </motion.div>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            {HEADER_PLATFORMS.map((p) => (
              <div
                key={p.label}
                title={p.label}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10"
              >
                <p.Icon className="size-4" style={{ color: p.color }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.header>
  );
}
