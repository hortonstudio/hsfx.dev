"use client";

import { useState } from "react";
import { Button, Input, Spinner, Modal, useToast } from "@/components/ui";
import type { ClientMockup } from "@/lib/clients/types";

interface WebflowDebugModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  mockup: ClientMockup | null;
  onPushComplete: () => void;
}

interface CollectionField {
  slug: string;
  displayName: string;
  type: string;
}

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
}

interface CollectionData {
  collectionId: string;
  displayName: string;
  fields: CollectionField[];
  items: CollectionItem[];
}

export function WebflowDebugModal({
  open,
  onClose,
  clientId,
  mockup,
  onPushComplete,
}: WebflowDebugModalProps) {
  const { addToast } = useToast();

  // Collection inspector
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);

  // Demo push
  const [demoName, setDemoName] = useState("Test Company");
  const [demoSlug, setDemoSlug] = useState("test-company");
  const [savingDemo, setSavingDemo] = useState(false);
  const [pushingDemo, setPushingDemo] = useState(false);

  // Manual JSON
  const [jsonText, setJsonText] = useState("");
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const [pushingJson, setPushingJson] = useState(false);

  // Re-push
  const [repushing, setRepushing] = useState(false);

  // ──────────────────────────────────────────────────
  // COLLECTION INSPECTOR
  // ──────────────────────────────────────────────────

  async function handleReadCollection() {
    setLoadingCollection(true);
    try {
      const res = await fetch("/api/webflow/collection");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to read collection");
      }
      const data = await res.json();
      setCollectionData(data);
    } catch (err) {
      addToast({
        variant: "error",
        title: "Failed to read collection",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoadingCollection(false);
    }
  }

  // ──────────────────────────────────────────────────
  // DEMO PUSH (save demo → push with custom slug)
  // ──────────────────────────────────────────────────

  async function handlePushDemo() {
    setSavingDemo(true);
    try {
      // Step 1: Save demo config to DB
      const demoRes = await fetch(`/api/clients/${clientId}/mockup/demo`, {
        method: "POST",
      });
      if (!demoRes.ok) {
        const data = await demoRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save demo config");
      }

      setSavingDemo(false);
      setPushingDemo(true);

      // Step 2: Push to Webflow with custom name/slug
      const pushRes = await fetch(`/api/clients/${clientId}/mockup/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: demoName, slug: demoSlug }),
      });

      if (!pushRes.ok) {
        const data = await pushRes.json().catch(() => ({}));
        throw new Error(data.error || "Webflow push failed");
      }

      addToast({ variant: "success", title: "Demo data pushed to Webflow" });
      onPushComplete();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Demo push failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSavingDemo(false);
      setPushingDemo(false);
    }
  }

  // ──────────────────────────────────────────────────
  // MANUAL JSON
  // ──────────────────────────────────────────────────

  function handleValidateJson() {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.master_json && !parsed.navbar_variant) {
        setJsonValid(false);
        addToast({
          variant: "error",
          title: "Invalid config",
          description: "JSON must have master_json or be a full MockupConfig",
        });
        return;
      }
      setJsonValid(true);
      addToast({ variant: "success", title: "JSON is valid" });
    } catch {
      setJsonValid(false);
      addToast({ variant: "error", title: "Invalid JSON syntax" });
    }
  }

  async function handlePushJson() {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      addToast({ variant: "error", title: "Invalid JSON" });
      return;
    }

    setPushingJson(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: parsed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Push failed");
      }

      addToast({ variant: "success", title: "JSON config pushed to Webflow" });
      onPushComplete();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Push failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPushingJson(false);
    }
  }

  // ──────────────────────────────────────────────────
  // RE-PUSH CURRENT CONFIG
  // ──────────────────────────────────────────────────

  async function handleRepush() {
    setRepushing(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Push failed");
      }

      addToast({ variant: "success", title: "Config re-pushed to Webflow" });
      onPushComplete();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Re-push failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRepushing(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Webflow Debug" size="xl">
      <div className="space-y-6 mt-2">
        {/* ──── Section 1: Collection Inspector ──── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-text-primary">Collection Inspector</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReadCollection}
              disabled={loadingCollection}
            >
              {loadingCollection ? (
                <>
                  <Spinner size="sm" />
                  Reading...
                </>
              ) : (
                "Read Collection"
              )}
            </Button>
          </div>

          {collectionData && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                <span className="font-medium">{collectionData.displayName}</span>{" "}
                <span className="text-text-dim">({collectionData.collectionId})</span>
              </p>

              {/* Fields */}
              <div>
                <p className="text-xs font-medium text-text-dim mb-1">
                  Fields ({collectionData.fields.length})
                </p>
                <div className="max-h-40 overflow-y-auto bg-background border border-border rounded-lg p-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-text-dim">
                        <th className="text-left pr-3 pb-1">Slug</th>
                        <th className="text-left pr-3 pb-1">Display Name</th>
                        <th className="text-left pb-1">Type</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-muted">
                      {collectionData.fields.map((f) => (
                        <tr key={f.slug}>
                          <td className="pr-3 py-0.5 font-mono">{f.slug}</td>
                          <td className="pr-3 py-0.5">{f.displayName}</td>
                          <td className="py-0.5">{f.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-medium text-text-dim mb-1">
                  Items ({collectionData.items.length})
                </p>
                {collectionData.items.length === 0 ? (
                  <p className="text-xs text-text-dim">No items in collection</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto bg-background border border-border rounded-lg p-2">
                    <div className="space-y-1">
                      {collectionData.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">{item.name}</span>
                          <span className="text-text-dim font-mono">/{item.slug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <hr className="border-border" />

        {/* ──── Section 2: Current Mockup Info ──── */}
        {mockup && (
          <>
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-text-primary">Current Mockup</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-dim">Status: </span>
                  <span className="text-text-muted">{mockup.status}</span>
                </div>
                <div>
                  <span className="text-text-dim">WF Item ID: </span>
                  <span className="text-text-muted font-mono">
                    {mockup.webflow_item_id || "(none)"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-dim">URL: </span>
                  <span className="text-text-muted">{mockup.webflow_url || "(none)"}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRepush}
                disabled={repushing || !mockup.config}
              >
                {repushing ? (
                  <>
                    <Spinner size="sm" />
                    Re-pushing...
                  </>
                ) : (
                  "Re-push Current Config"
                )}
              </Button>
            </section>

            <hr className="border-border" />
          </>
        )}

        {/* ──── Section 3: Push Demo ──── */}
        <section className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Push Demo Data</h4>
          <p className="text-xs text-text-dim">
            Save hardcoded demo config and push to Webflow with a custom name/slug.
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={demoName}
              onChange={(e) => {
                setDemoName(e.target.value);
                setDemoSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                );
              }}
              placeholder="Item name"
            />
            <Input
              value={demoSlug}
              onChange={(e) => setDemoSlug(e.target.value)}
              placeholder="slug"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePushDemo}
            disabled={savingDemo || pushingDemo || !demoName.trim() || !demoSlug.trim()}
          >
            {savingDemo ? (
              <>
                <Spinner size="sm" />
                Saving demo...
              </>
            ) : pushingDemo ? (
              <>
                <Spinner size="sm" />
                Pushing to WF...
              </>
            ) : (
              "Push Demo"
            )}
          </Button>
        </section>

        <hr className="border-border" />

        {/* ──── Section 4: Manual JSON ──── */}
        <section className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Manual JSON Push</h4>
          <p className="text-xs text-text-dim">
            Paste a full MockupConfig JSON and push directly to Webflow.
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonValid(null);
            }}
            placeholder='{"master_json": {...}, "navbar_variant": "...", ...}'
            className="w-full h-32 bg-background border border-border rounded-lg p-3 text-xs font-mono text-text-secondary placeholder:text-text-dim resize-y focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleValidateJson}
              disabled={!jsonText.trim()}
            >
              Validate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePushJson}
              disabled={pushingJson || jsonValid !== true}
            >
              {pushingJson ? (
                <>
                  <Spinner size="sm" />
                  Pushing...
                </>
              ) : (
                "Push JSON to Webflow"
              )}
            </Button>
            {jsonValid === true && (
              <span className="text-xs text-emerald-400">Valid</span>
            )}
            {jsonValid === false && (
              <span className="text-xs text-red-400">Invalid</span>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
