"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronDown } from "lucide-react";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import type { SitemapPageType } from "@/lib/clients/sitemap-types";

const STATUS_LEGEND = [
  { label: "Planned", color: "#6b7280" },
  { label: "In Progress", color: "#f59e0b" },
  { label: "Complete", color: "#10b981" },
  { label: "Deferred", color: "#8b5cf6" },
];

export function SitemapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-3 py-2 border border-border
          bg-surface/90 backdrop-blur-sm shadow-sm text-xs text-text-muted
          hover:text-text-primary hover:border-border-hover transition-all
          ${open ? "rounded-t-xl border-b-0" : "rounded-xl"}
        `}
      >
        <Info className="w-3.5 h-3.5" />
        Legend
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Legend panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden rounded-b-xl rounded-tr-xl border border-border border-t-0 bg-surface/90 backdrop-blur-sm shadow-sm"
          >
            <div className="p-4 space-y-4">
              {/* Page Types */}
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Page Types
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {(Object.entries(PAGE_TYPE_CONFIG) as [SitemapPageType, { label: string; color: string }][]).map(
                    ([, config]) => (
                      <div key={config.label} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-[11px] text-text-muted">{config.label}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Status
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {STATUS_LEGEND.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-[11px] text-text-muted">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
