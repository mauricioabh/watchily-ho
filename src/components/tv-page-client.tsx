"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { AppLocale } from "@/i18n/locale";

export type TVPageLabels = {
  home: string;
  search: string;
  lists: string;
  all: string;
  signOut: string;
};

const DEFAULT_LABELS: TVPageLabels = {
  home: "Home",
  search: "Search",
  lists: "Lists",
  all: "View all",
  signOut: "Sign out",
};

export function TVPageClient({
  labels = DEFAULT_LABELS,
  locale = "en",
}: {
  labels?: TVPageLabels;
  locale?: AppLocale;
}) {
  const localizedPath = (path: string) =>
    locale === "es" ? `/es${path}` : path;

  return (
    <>
      <motion.h1
        className="mb-6 text-2xl font-bold"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Watchily
      </motion.h1>
      <motion.nav
        className="mb-8 flex flex-wrap gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Link
          href={localizedPath("/tv")}
          className="rounded bg-primary px-4 py-2 text-primary-foreground focus:outline-2 focus:outline-primary"
        >
          {labels.home}
        </Link>
        <Link
          href={localizedPath("/search?device=tv")}
          className="rounded border border-border px-4 py-2 focus:outline-2 focus:outline-primary"
        >
          {labels.search}
        </Link>
        <Link
          href={localizedPath("/lists?device=tv")}
          className="rounded border border-border px-4 py-2 focus:outline-2 focus:outline-primary"
        >
          {labels.lists}
        </Link>
        <Link
          href={localizedPath("/lists/all?device=tv")}
          className="rounded border border-border px-4 py-2 focus:outline-2 focus:outline-primary"
        >
          {labels.all}
        </Link>
        <form action="/auth/signout" method="POST" className="inline">
          <button
            type="submit"
            className="rounded border border-border px-4 py-2 focus:outline-2 focus:outline-primary"
          >
            {labels.signOut}
          </button>
        </form>
      </motion.nav>
    </>
  );
}
