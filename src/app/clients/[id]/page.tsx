"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Spinner,
  EmptyState,
  Button,
  GridBackground,
  PageTransition,
  CursorGlow,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import { ClientOverview } from "@/components/clients/ClientOverview";
import { KnowledgeBase } from "@/components/clients/KnowledgeBase";
import { OnboardingTab } from "@/components/clients/OnboardingTab";
import { MockupTab } from "@/components/clients/MockupTab";
import { SitemapTab } from "@/components/sitemap/SitemapTab";
import type { Client, KnowledgeEntry, KnowledgeDocument, ClientMockup } from "@/lib/clients/types";
import type { ClientSitemap } from "@/lib/clients/sitemap-types";
import type { OnboardConfig, OnboardSubmission } from "@/lib/onboard/types";

// ════════════════════════════════════════════════════════════
// PAGE CONTENT
// ════════════════════════════════════════════════════════════

function ClientDetailContent({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [knowledgeDoc, setKnowledgeDoc] = useState<KnowledgeDocument | null>(null);
  const [onboardConfigs, setOnboardConfigs] = useState<OnboardConfig[]>([]);
  const [submissions, setSubmissions] = useState<OnboardSubmission[]>([]);
  const [mockup, setMockup] = useState<ClientMockup | null>(null);
  const [sitemap, setSitemap] = useState<ClientSitemap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    // Only show loading spinner on initial load, not on refetch
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    setError(null);

    const supabase = createClient();

    // Fetch client
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (clientError || !clientData) {
      setError("Client not found");
      setLoading(false);
      return;
    }

    setClient(clientData as Client);

    // Fetch related data in parallel
    const [entriesResult, docResult, configsResult, mockupResult, sitemapResult] = await Promise.all([
      supabase
        .from("client_knowledge_entries")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_knowledge_documents")
        .select("*")
        .eq("client_id", id)
        .maybeSingle(),
      supabase
        .from("onboard_configs")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_mockups")
        .select("*")
        .eq("client_id", id)
        .maybeSingle(),
      supabase
        .from("client_sitemaps")
        .select("*")
        .eq("client_id", id)
        .maybeSingle(),
    ]);

    setKnowledgeEntries((entriesResult.data as KnowledgeEntry[]) ?? []);
    setKnowledgeDoc((docResult.data as KnowledgeDocument) ?? null);
    setOnboardConfigs((configsResult.data as OnboardConfig[]) ?? []);
    setMockup((mockupResult.data as ClientMockup) ?? null);
    setSitemap((sitemapResult.data as ClientSitemap) ?? null);

    // Fetch submissions for all onboard configs
    const configIds = (configsResult.data ?? []).map((c: OnboardConfig) => c.id);
    if (configIds.length > 0) {
      const { data: submissionData } = await supabase
        .from("onboard_submissions")
        .select("*")
        .in("config_id", configIds)
        .order("created_at", { ascending: false });

      setSubmissions((submissionData as OnboardSubmission[]) ?? []);
    } else {
      setSubmissions([]);
    }

    setLoading(false);
    initialLoadDone.current = true;
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <EmptyState
        title="Client not found"
        description={error ?? `No client found with id "${id}".`}
        action={
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl text-text-primary">
          {client.first_name} {client.last_name}
        </h1>
        <p className="text-text-muted mt-1">{client.business_name}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="knowledge">Knowledge Base</Tab>
          <Tab value="onboarding">Onboarding</Tab>
          <Tab value="mockup">Mockup</Tab>
          <Tab value="sitemap">Sitemap</Tab>
        </TabList>

        <TabPanel value="overview">
          <ClientOverview
            client={client}
            knowledgeEntryCount={knowledgeEntries.length}
            onboardConfigCount={onboardConfigs.length}
            submissionCount={submissions.length}
            onClientUpdated={fetchData}
          />
        </TabPanel>

        <TabPanel value="knowledge">
          <KnowledgeBase
            clientId={id}
            clientName={client?.business_name || client?.first_name + " " + client?.last_name || ""}
            entries={knowledgeEntries}
            compiledDoc={knowledgeDoc}
            onDataChanged={fetchData}
          />
        </TabPanel>

        <TabPanel value="onboarding">
          <OnboardingTab
            client={client}
            configs={onboardConfigs}
            submissions={submissions}
            compiledKB={knowledgeDoc?.content ?? null}
            onDataChanged={fetchData}
          />
        </TabPanel>

        <TabPanel value="mockup">
          <MockupTab
            clientId={id}
            mockup={mockup}
            compiledDoc={knowledgeDoc}
            onDataChanged={fetchData}
          />
        </TabPanel>

        <TabPanel value="sitemap">
          <SitemapTab
            clientId={id}
            sitemap={sitemap}
            compiledDoc={knowledgeDoc}
            onDataChanged={fetchData}
          />
        </TabPanel>
      </Tabs>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <ProtectedRoute>
      <PageTransition>
        <GridBackground />
        <CursorGlow />
        <Navbar />
        <main className="min-h-screen pt-24 md:pt-28 pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <ClientDetailContent id={id} />
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
