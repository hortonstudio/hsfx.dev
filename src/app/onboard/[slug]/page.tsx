import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { OnboardForm } from "./OnboardForm";
import type { Metadata } from "next";
import type { OnboardConfig, OnboardSubmission } from "@/lib/onboard/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("onboard_configs")
    .select("client_name, business_name")
    .eq("client_slug", slug)
    .eq("status", "active")
    .single();

  if (!config) {
    return { title: "Onboarding" };
  }

  return {
    title: `${config.business_name} Onboarding`,
    description: `Client onboarding form for ${config.client_name}`,
  };
}

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Session auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/client?redirect=/onboard/${slug}`);
  }

  const { data: config } = await supabase
    .from("onboard_configs")
    .select("*")
    .eq("client_slug", slug)
    .eq("status", "active")
    .single();

  if (!config || !config.client_email || config.client_email !== user.email) {
    notFound();
  }

  const { data: submission } = await supabase
    .from("onboard_submissions")
    .select("*")
    .eq("client_slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { access_token: _token, ...safeConfig } = config;

  return (
    <OnboardForm
      config={safeConfig as OnboardConfig}
      existingSubmission={(submission as OnboardSubmission) ?? null}
    />
  );
}
