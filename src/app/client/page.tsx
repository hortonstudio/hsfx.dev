import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientPortal } from "./ClientPortal";
import type { Metadata } from "next";
import type { OnboardConfig, OnboardSubmission } from "@/lib/onboard/types";

export const metadata: Metadata = {
  title: "Client Portal",
};

export default async function ClientPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (redirectParam) {
      redirect(redirectParam);
    }

    const { data: configs } = await supabase
      .from("onboard_configs")
      .select("*")
      .eq("client_email", user.email)
      .eq("status", "active");

    const configSlugs = (configs ?? []).map((c: OnboardConfig) => c.client_slug);

    let submissions: OnboardSubmission[] = [];
    if (configSlugs.length > 0) {
      const { data } = await supabase
        .from("onboard_submissions")
        .select("*")
        .in("client_slug", configSlugs);
      submissions = (data as OnboardSubmission[]) ?? [];
    }

    return (
      <ClientPortal
        user={user}
        configs={(configs as OnboardConfig[]) ?? []}
        submissions={submissions}
      />
    );
  }

  return (
    <ClientPortal
      user={null}
      configs={[]}
      submissions={[]}
      redirectTo={redirectParam}
    />
  );
}
