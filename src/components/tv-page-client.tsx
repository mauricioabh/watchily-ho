"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function TVPageClient() {
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
        className="mb-8 flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Link
          href="/tv"
          className="rounded bg-primary px-4 py-2 text-primary-foreground focus:outline-2 focus:outline-primary"
        >
          Inicio
        </Link>
        <Link
          href="/search?device=tv"
          className="rounded border border-border px-4 py-2 focus:outline-2 focus:outline-primary"
        >
          Buscar
        </Link>
        <Link
          href="/lists/all?device=tv"
          className="rounded border border-border px-4 py-2 focus:outline-2 focus:outline-primary"
        >
          Ver todo
        </Link>
      </motion.nav>
    </>
  );
}
