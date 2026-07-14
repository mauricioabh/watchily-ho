import type { IconType } from "react-icons";
import { TbBrandDisney } from "react-icons/tb";
import {
  SiAppletv,
  SiCrunchyroll,
  SiHbo,
  SiNetflix,
  SiParamountplus,
  SiPrimevideo,
} from "react-icons/si";

export type ProviderMeta = {
  id: string;
  name: string;
  icon: IconType;
  color: string;
};

/** Canonical list of selectable streaming providers (UI). */
export const PROVIDER_META: readonly ProviderMeta[] = [
  { id: "netflix", name: "Netflix", icon: SiNetflix, color: "#E50914" },
  { id: "disney_plus", name: "Disney+", icon: TbBrandDisney, color: "#113CCF" },
  { id: "hbo_max", name: "HBO Max", icon: SiHbo, color: "#B535F6" },
  {
    id: "amazon_prime",
    name: "Prime Video",
    icon: SiPrimevideo,
    color: "#00A8E1",
  },
  {
    id: "apple_tv_plus",
    name: "Apple TV+",
    icon: SiAppletv,
    color: "#FFFFFF",
  },
  {
    id: "paramount_plus",
    name: "Paramount+",
    icon: SiParamountplus,
    color: "#0064FF",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    icon: SiCrunchyroll,
    color: "#F47521",
  },
] as const;

export function getProviderMeta(id: string): ProviderMeta | undefined {
  return PROVIDER_META.find((p) => p.id === id);
}
