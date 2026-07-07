import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Mis listas",
  pathname: "/lists",
  noIndex: true,
});

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
