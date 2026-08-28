import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { localizedPath } from "@/i18n/routing";

export default async function ListsPage() {
  redirect(localizedPath("/library", await getLocale()));
}
