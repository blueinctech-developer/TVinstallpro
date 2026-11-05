import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/admin/auth";
import { VerifyScreen } from "./forms";
import { MfaShell } from "./shell";

export const metadata: Metadata = { title: "Two-factor sign-in" };

export default async function MfaPage() {
  const u = await sessionUser();
  if (!u) redirect("/admin/login");
  if (!u.mfaEnrolled) redirect("/admin/2fa/setup");
  if (u.mfaPassed) redirect("/admin");
  return (
    <MfaShell email={u.email}>
      <VerifyScreen />
    </MfaShell>
  );
}
