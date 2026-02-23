"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Button,
  Spinner,
  Modal,
  GridBackground,
  PageTransition,
  CursorGlow,
  useToast,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import type { StockImage } from "@/lib/stock-images/types";
import { STOCK_IMAGE_CATEGORIES } from "@/lib/stock-images/types";

// ════════════════════════════════════════════════════════════
// SYNC INDICATOR
// ════════════════════════════════════════════════════════════

type SyncStatus = "idle" | "saving" | "saved" | "error";

function SyncIndicator({ status }: { status: SyncStatus }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "saving" && (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-text-muted">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-text-muted">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-400">Error saving</span>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CATEGORY FILTER BAR (also drop targets)
// ════════════════════════════════════════════════════════════

function CategoryFilterBar({
  categories,
  activeCategory,
  counts,
  onSelect,
  onDropOnCategory,
}: {
  categories: string[];
  activeCategory: string | null;
  counts: Map<string, number>;
  onSelect: (category: string | null) => void;
  onDropOnCategory: (category: string) => void;
}) {
  const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  return (
    <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
          activeCategory === null
            ? "bg-accent/20 text-accent font-medium"
            : "text-text-muted hover:text-text-primary hover:bg-surface"
        }`}
      >
        All ({total})
      </button>
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverCategory(c);
          }}
          onDragLeave={() => setDragOverCategory(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverCategory(null);
            onDropOnCategory(c);
          }}
          className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
            dragOverCategory === c
              ? "bg-accent/30 text-accent ring-2 ring-accent/50"
              : activeCategory === c
                ? "bg-accent/20 text-accent font-medium"
                : "text-text-muted hover:text-text-primary hover:bg-surface"
          }`}
        >
          {c} ({counts.get(c) || 0})
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// IMAGE CARD
// ════════════════════════════════════════════════════════════

function ImageCard({
  image,
  onClick,
  onDragStart,
}: {
  image: StockImage;
  onClick: () => void;
  onDragStart: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className="group relative aspect-[4/3] rounded-lg border border-border hover:border-accent/50 hover:ring-1 hover:ring-accent/20 transition-all overflow-hidden bg-surface/50 cursor-grab active:cursor-grabbing"
      title={`${image.name} (${image.category})`}
    >
      <Image
        src={image.image_url}
        alt={image.name}
        fill
        className="object-cover"
        sizes="200px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate font-medium">{image.name}</p>
        <p className="text-[10px] text-white/60 truncate">{image.category}</p>
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// SEED IMAGES LIST
// ════════════════════════════════════════════════════════════

const SEED_IMAGES = [
  // Roofing
  { name: "residential-roof-repair", category: "roofing", url: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1200&q=80" },
  { name: "shingle-installation", category: "roofing", url: "https://images.unsplash.com/photo-1591588582259-e675bd2e6088?w=1200&q=80" },
  { name: "roof-inspection", category: "roofing", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80" },
  { name: "metal-roofing", category: "roofing", url: "https://images.unsplash.com/photo-1625766763788-95ed46f1b6d3?w=1200&q=80" },
  // Plumbing
  { name: "pipe-repair", category: "plumbing", url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80" },
  { name: "bathroom-plumbing", category: "plumbing", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80" },
  { name: "kitchen-faucet", category: "plumbing", url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" },
  { name: "water-heater", category: "plumbing", url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80" },
  // HVAC
  { name: "ac-unit-outdoor", category: "hvac", url: "https://images.unsplash.com/photo-1631545806609-4317f4f1cb31?w=1200&q=80" },
  { name: "hvac-technician", category: "hvac", url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80" },
  { name: "ductwork", category: "hvac", url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80" },
  // Landscaping
  { name: "lawn-mowing", category: "landscaping", url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&q=80" },
  { name: "garden-design", category: "landscaping", url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=80" },
  { name: "tree-trimming", category: "landscaping", url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80" },
  { name: "patio-landscaping", category: "landscaping", url: "https://images.unsplash.com/photo-1598902108854-d1446614550d?w=1200&q=80" },
  // Electrical
  { name: "electrical-panel", category: "electrical", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80" },
  { name: "wiring-work", category: "electrical", url: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=1200&q=80" },
  { name: "electrician-working", category: "electrical", url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=80" },
  // Painting
  { name: "interior-painting", category: "painting", url: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1200&q=80" },
  { name: "exterior-painting", category: "painting", url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80" },
  { name: "paint-roller", category: "painting", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80" },
  // Cleaning
  { name: "house-cleaning", category: "cleaning", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80" },
  { name: "pressure-washing", category: "cleaning", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80" },
  { name: "carpet-cleaning", category: "cleaning", url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=1200&q=80" },
  // Construction
  { name: "construction-site", category: "construction", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80" },
  { name: "framing-work", category: "construction", url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80" },
  { name: "renovation-progress", category: "construction", url: "https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?w=1200&q=80" },
  { name: "blueprint-planning", category: "construction", url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80" },
  // Hero
  { name: "suburban-house-front", category: "hero", url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80" },
  { name: "modern-home-exterior", category: "hero", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80" },
  { name: "craftsman-home", category: "hero", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80" },
  { name: "luxury-home", category: "hero", url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80" },
  { name: "neighborhood-street", category: "hero", url: "https://images.unsplash.com/photo-1592595896616-c37162298647?w=1200&q=80" },
  // About
  { name: "team-at-work", category: "about", url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80" },
  { name: "handshake-meeting", category: "about", url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80" },
  { name: "contractor-portrait", category: "about", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&q=80" },
  { name: "office-planning", category: "about", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" },
  // Team
  { name: "construction-crew", category: "team", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80" },
  { name: "worker-portrait", category: "team", url: "https://images.unsplash.com/photo-1540479859555-17af45c78602?w=1200&q=80" },
  { name: "team-meeting", category: "team", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80" },
  // Tools & Equipment
  { name: "tool-belt", category: "tools-equipment", url: "https://images.unsplash.com/photo-1581147036324-c17ac41f3e6b?w=1200&q=80" },
  { name: "workshop-tools", category: "tools-equipment", url: "https://images.unsplash.com/photo-1530124566582-a45a7e3f3867?w=1200&q=80" },
  { name: "power-tools", category: "tools-equipment", url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&q=80" },
  { name: "work-truck", category: "tools-equipment", url: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80" },
];

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function StockImagesContent() {
  const { addToast } = useToast();

  // Data
  const [images, setImages] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal
  const [editingImage, setEditingImage] = useState<StockImage | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Seed
  const [seeding, setSeeding] = useState(false);

  // Upload & drag-drop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragCounterRef = useRef(0);
  const draggedImageRef = useRef<StockImage | null>(null);

  // Derived data
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const img of images) {
      map.set(img.category, (map.get(img.category) || 0) + 1);
    }
    return map;
  }, [images]);

  const categoryNames = useMemo(
    () => Array.from(categoryCounts.keys()).sort(),
    [categoryCounts]
  );

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchesCategory = !activeCategory || img.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [images, activeCategory, searchQuery]);

  // ── Fetch ──────────────────────────────────────────────
  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/stock-images");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error("Error fetching stock images:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // ── Open edit modal ────────────────────────────────────
  const openEditor = (image: StockImage) => {
    setEditingImage(image);
    setEditName(image.name);
    setEditCategory(image.category);
    setHasUnsavedChanges(false);
    setSyncStatus("idle");
  };

  const closeEditor = () => {
    setEditingImage(null);
    setEditName("");
    setEditCategory("");
    setHasUnsavedChanges(false);
  };

  // ── Save existing image ─────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!editingImage) return;

    setSyncStatus("saving");

    try {
      const res = await fetch(`/api/stock-images/${editingImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), category: editCategory.trim() }),
      });

      if (!res.ok) throw new Error("Save failed");

      const updated = await res.json();
      setImages((prev) => prev.map((i) => (i.id === editingImage.id ? updated : i)));
      setEditingImage(updated);
      setHasUnsavedChanges(false);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch {
      setSyncStatus("error");
    }
  }, [editingImage, editName, editCategory]);

  // ── Delete image ────────────────────────────────────────
  const handleDelete = async () => {
    if (!editingImage) return;

    try {
      const res = await fetch(`/api/stock-images/${editingImage.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setImages((prev) => prev.filter((i) => i.id !== editingImage.id));
      setShowDeleteModal(false);
      closeEditor();
      addToast({ variant: "success", title: "Image deleted" });
    } catch {
      addToast({ variant: "error", title: "Failed to delete image" });
    }
  };

  // ── Drag image onto category ────────────────────────────
  const handleDropOnCategory = async (category: string) => {
    const image = draggedImageRef.current;
    if (!image || image.category === category) return;

    // Optimistic update
    setImages((prev) =>
      prev.map((i) => (i.id === image.id ? { ...i, category } : i))
    );

    try {
      const res = await fetch(`/api/stock-images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });

      if (!res.ok) throw new Error("Update failed");

      addToast({ variant: "success", title: `Moved to ${category}` });
    } catch {
      // Revert
      setImages((prev) =>
        prev.map((i) => (i.id === image.id ? { ...i, category: image.category } : i))
      );
      addToast({ variant: "error", title: "Failed to move image" });
    }

    draggedImageRef.current = null;
  };

  // ── File upload ──────────────────────────────────────
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);

    const uploadCategory = activeCategory || "uncategorized";
    let successCount = 0;

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) continue;

      try {
        // Compress if browser-image-compression is available
        let processedFile = file;
        try {
          const imageCompression = (await import("browser-image-compression")).default;
          processedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
        } catch {
          // Compression not available, use original
        }

        // Get signed URL
        const uploadRes = await fetch("/api/stock-images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: processedFile.type,
            category: uploadCategory,
          }),
        });

        if (!uploadRes.ok) continue;
        const { signedUrl, publicUrl } = await uploadRes.json();

        // Upload file
        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": processedFile.type },
          body: processedFile,
        });

        if (!putRes.ok) continue;

        // Create DB record
        const name = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-");
        const createRes = await fetch("/api/stock-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category: uploadCategory,
            image_url: publicUrl,
          }),
        });

        if (createRes.ok) {
          const newImage = await createRes.json();
          setImages((prev) => [...prev, newImage]);
          successCount++;
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      addToast({ variant: "success", title: `Uploaded ${successCount} image${successCount > 1 ? "s" : ""}` });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
      e.target.value = "";
    }
  };

  // ── Drag & drop files ────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only activate for file drops, not image card drags
    if (e.dataTransfer.types.includes("Files")) {
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // ── Seed ──────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);

    try {
      const res = await fetch("/api/stock-images/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: SEED_IMAGES }),
      });

      if (!res.ok) throw new Error("Seed failed");

      const result = await res.json();
      addToast({
        variant: result.failed > 0 ? "warning" : "success",
        title: `Seeded ${result.succeeded} images${result.failed > 0 ? ` (${result.failed} failed)` : ""}`,
      });

      // Refetch all
      await fetchImages();
    } catch {
      addToast({ variant: "error", title: "Failed to seed images" });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <GridBackground />
      <CursorGlow />
      <Navbar />

      <main
        className="min-h-screen pt-16 md:pt-20 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Header */}
        <header className="sticky top-16 md:top-20 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </Link>
              <span className="text-border">|</span>
              <h1 className="font-serif text-lg font-medium text-text-primary">Stock Images</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images..."
                  className="pl-8 pr-3 py-1.5 w-48 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
              >
                {seeding ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-1">Seeding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Seed Images
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-1">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleInputChange}
                multiple
                accept="image/*"
              />
            </div>
          </div>
        </header>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-accent/50 bg-accent/5">
              <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-accent font-medium">Drop images here</p>
              <p className="text-text-muted text-sm">
                {activeCategory ? `Will be added to "${activeCategory}"` : "Will be added to \"uncategorized\""}
              </p>
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        <CategoryFilterBar
          categories={categoryNames}
          activeCategory={activeCategory}
          counts={categoryCounts}
          onSelect={setActiveCategory}
          onDropOnCategory={handleDropOnCategory}
        />

        {/* Image grid */}
        <div className="p-4">
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {filteredImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onClick={() => openEditor(image)}
                  onDragStart={() => { draggedImageRef.current = image; }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="w-16 h-16 text-text-dim mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z"
                />
              </svg>
              <h2 className="font-serif text-xl text-text-primary mb-2">
                {searchQuery || activeCategory ? "No images match" : "No stock images yet"}
              </h2>
              <p className="text-text-muted text-sm max-w-xs">
                {searchQuery || activeCategory
                  ? "Try adjusting your search or filter"
                  : "Click \"Seed Images\" to get started with curated stock photos"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ═══ Edit Image Modal ═══ */}
      <Modal
        open={!!editingImage}
        onClose={closeEditor}
        title={editingImage ? `Edit: ${editingImage.name}` : "Edit Image"}
        size="xl"
      >
        {editingImage && (
          <div className="space-y-4">
            {/* Image preview + fields */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-48 h-36 relative rounded-lg border border-border bg-background overflow-hidden">
                <Image
                  src={editingImage.image_url}
                  alt={editingImage.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-dim mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-dim mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => {
                        setEditCategory(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                    >
                      {STOCK_IMAGE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      {/* Show current category if not in predefined list */}
                      {!STOCK_IMAGE_CATEGORIES.includes(editCategory as never) && (
                        <option value={editCategory}>{editCategory}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-dim mb-1">URL</label>
                  <input
                    type="text"
                    value={editingImage.image_url}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm bg-background/50 border border-border rounded-lg text-text-dim cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <SyncIndicator status={syncStatus} />
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || syncStatus === "saving"}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ Delete Confirmation ═══ */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Image"
        size="sm"
      >
        <p className="text-sm text-text-muted mb-4">
          Are you sure you want to delete <strong className="text-text-primary">{editingImage?.name}</strong>?
          This will also remove the file from storage.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════

export default function StockImagesPage() {
  return (
    <ProtectedRoute>
      <StockImagesContent />
    </ProtectedRoute>
  );
}
