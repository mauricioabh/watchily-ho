"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  LogOut,
  Settings,
  Film,
  Home,
  List,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { TbBrandDisney, TbBrandHbo, TbBrandNetflix } from "react-icons/tb";
import { SiAppletv, SiCrunchyroll, SiPrimevideo } from "react-icons/si";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

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
  const urlQuery = pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);

  // Sync search input + close mobile menu when the route changes (render-time adjust).
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  // Prevent body scroll while mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setMenuOpen(false);
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
      <div className="container mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        {/* Logo */}
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            <Film className="size-5 text-primary" aria-hidden />
            Watchily
          </Link>
        </motion.div>

        {user ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.08 + i * 0.04 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/6 hover:text-foreground",
                      pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                        ? "bg-white/8 text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Desktop search + actions */}
            <motion.div
              className="ml-auto hidden items-center gap-2 md:flex"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Películas o series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-52 rounded-lg border-white/10 bg-white/5 text-sm placeholder:text-muted-foreground focus-visible:ring-primary lg:w-72"
                  aria-label="Buscar"
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  className="h-9 shrink-0 rounded-lg px-3"
                >
                  <Search className="size-4" />
                  Buscar
                </Button>
              </form>
              <Button asChild variant="ghost" size="icon" title="Configuración">
                <Link href="/settings" aria-label="Configuración">
                  <Settings className="size-4" />
                </Link>
              </Button>
              <form action="/auth/signout" method="post" className="inline">
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  title="Cerrar sesión"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </motion.div>

            {/* Mobile: search shortcut + menu toggle */}
            <div className="ml-auto flex items-center gap-1 md:hidden">
              <Button asChild variant="ghost" size="icon" className="size-9">
                <Link href="/search" aria-label="Buscar">
                  <Search className="size-5" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-1.5 overflow-hidden sm:gap-2">
            {HEADER_PLATFORMS.map((p, i) => (
              <div
                key={p.label}
                title={p.label}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10",
                  i >= 4 && "hidden sm:flex",
                )}
              >
                <p.Icon className="size-4" style={{ color: p.color }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {user && menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/8 md:hidden"
          >
            <div className="container mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Películas o series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 flex-1 rounded-lg border-white/10 bg-white/5 text-sm"
                  aria-label="Buscar"
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  className="h-10 shrink-0 rounded-lg px-3"
                >
                  <Search className="size-4" />
                </Button>
              </form>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:bg-white/6 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2 border-t border-white/8 pt-3">
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 flex-1 justify-start gap-3 px-3"
                >
                  <Link href="/settings">
                    <Settings className="size-5" />
                    Configuración
                  </Link>
                </Button>
                <form action="/auth/signout" method="post" className="flex-1">
                  <Button
                    variant="ghost"
                    type="submit"
                    className="h-11 w-full justify-start gap-3 px-3"
                  >
                    <LogOut className="size-5" />
                    Salir
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
