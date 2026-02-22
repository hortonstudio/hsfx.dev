"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Button,
  Spinner,
  Input,
  EmptyState,
  GridBackground,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import { ClientCard } from "@/components/clients/ClientCard";
import { CreateClientModal } from "@/components/clients/CreateClientModal";
import type { Client } from "@/lib/clients/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  async function fetchClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.business_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <ProtectedRoute>
      <PageTransition>
        <GridBackground />
        <CursorGlow />
        <Navbar />
        <main className="min-h-screen pt-24 md:pt-28 pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-10">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-2">
                  Clients
                </h1>
                <p className="text-text-muted">
                  {clients.length} client{clients.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                New Client
              </Button>
            </div>

            {/* Search */}
            {clients.length > 0 && (
              <div className="mb-8">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, business, or email..."
                  leftIcon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  }
                />
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : clients.length === 0 ? (
              <EmptyState
                title="No clients yet"
                description="Create your first client to get started."
                icon={
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-dim"
                  >
                    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
                action={
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    New Client
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No matches"
                description={`No clients match "${search}".`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            )}
          </div>
        </main>

        <CreateClientModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            fetchClients();
          }}
        />
      </PageTransition>
    </ProtectedRoute>
  );
}
