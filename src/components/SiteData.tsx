"use client";

import { createContext, useContext } from "react";
import { defaultSiteData, type SiteData } from "@/lib/site-defaults";

// Business details, services and prices as saved in the admin, for client components.
// Provided once by the public site's layout; falls back to the code defaults.
const Ctx = createContext<SiteData>(defaultSiteData);

export function SiteDataProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSiteData = () => useContext(Ctx);
