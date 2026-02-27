import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import PublicSitemapViewer from "./PublicSitemapViewer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("client_sitemaps")
    .select("title, published_data, package_tier")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!data || !data.published_data) {
    return {
      title: "Sitemap Not Found",
    };
  }

  const pageCount = data.published_data?.nodes?.length ?? 0;
  const tier = data.package_tier
    ? data.package_tier.charAt(0).toUpperCase() + data.package_tier.slice(1)
    : null;

  const title = `${data.title} — Sitemap`;
  const description = tier
    ? `${tier} website sitemap with ${pageCount} pages. Interactive sitemap planning and review.`
    : `Website sitemap with ${pageCount} pages. Interactive sitemap planning and review.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function PublicSitemapPage() {
  return <PublicSitemapViewer />;
}
