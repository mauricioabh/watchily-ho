"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Search, LogOut, Settings, Film, Library, Menu, X } from "lucide-react";
import { TbBrandDisney, TbBrandHbo, TbBrandNetflix } from "react-icons/tb";
import { SiAppletv, SiCrunchyroll, SiPrimevideo } from "react-icons/si";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const HEADER_PLATFORMS = [
  { Icon: TbBrandNetflix, color: "#E50914", label: "Netflix" },
  { Icon: TbBrandDisney, color: "#113CCF", label: "Disney+" },
  { Icon: SiPrimevideo, color: "#00A8E1", label: "Prime Video" },
  { Icon: TbBrandHbo, color: "#B535F6", label: "HBO Max" },
  { Icon: SiCrunchyroll, color: "#F47521", label: "Crunchyroll" },
  { Icon: SiAppletv, color: "#FFFFFF", label: "Apple TV" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderClient({ user }: { user: User | null }) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const iconBtnClass = (href: string) =>
    cn(
      "size-9 rounded-lg transition-colors hover:bg-white/6",
      isActive(pathname, href)
        ? "bg-white/10 text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-white/8 bg-linear-to-b from-zinc-900/95 to-background/98 backdrop-blur-md"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="container mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
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
            <nav className="ml-auto hidden items-center gap-1 md:flex">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={iconBtnClass("/search")}
                title={t("search")}
              >
                <Link href="/search" aria-label={t("search")}>
                  <Search className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={iconBtnClass("/library")}
                title={t("myLibrary")}
              >
                <Link href="/library" aria-label={t("myLibrary")}>
                  <Library className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={iconBtnClass("/settings")}
                title={t("settings")}
              >
                <Link href="/settings" aria-label={t("settings")}>
                  <Settings className="size-4" />
                </Link>
              </Button>
              <form action="/auth/signout" method="post" className="inline">
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  className="size-9 text-muted-foreground hover:text-foreground"
                  title={t("signOut")}
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </nav>

            <div className="ml-auto flex items-center gap-1 md:hidden">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={iconBtnClass("/search")}
                title={t("search")}
              >
                <Link
                  href="/search"
                  aria-label={t("search")}
                  onClick={() => setMenuOpen(false)}
                >
                  <Search className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={iconBtnClass("/library")}
                title={t("myLibrary")}
              >
                <Link
                  href="/library"
                  aria-label={t("myLibrary")}
                  onClick={() => setMenuOpen(false)}
                >
                  <Library className="size-5" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
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
            <div className="container mx-auto max-w-6xl space-y-2 px-4 py-4 sm:px-6">
              <Button
                asChild
                variant="ghost"
                className="h-11 w-full justify-start gap-3 px-3"
              >
                <Link href="/settings" onClick={() => setMenuOpen(false)}>
                  <Settings className="size-5" />
                  {t("settings")}
                </Link>
              </Button>
              <form action="/auth/signout" method="post">
                <Button
                  variant="ghost"
                  type="submit"
                  className="h-11 w-full justify-start gap-3 px-3"
                >
                  <LogOut className="size-5" />
                  {t("signOut")}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
