import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { localizedPath } from "@/i18n/routing";

export default async function PopularPage() {
  redirect(localizedPath("/search", await getLocale()));
}
