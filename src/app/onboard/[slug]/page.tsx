import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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

  const { data: config } = await supabase
    .from("onboard_configs")
    .select("*")
    .eq("client_slug", slug)
    .eq("status", "active")
    .single();

  if (!config) {
    notFound();
  }

  const { data: submission } = await supabase
    .from("onboard_submissions")
    .select("*")
    .eq("client_slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <OnboardForm
      config={config as OnboardConfig}
      existingSubmission={(submission as OnboardSubmission) ?? null}
    />
  );
}
