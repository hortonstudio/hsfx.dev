"use client";

import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adjust position if menu would overflow viewport
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }, [x, y]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Invisible backdrop to catch clicks */}
      <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[160px] py-1 bg-surface border border-border rounded-lg shadow-xl shadow-black/30"
        style={{ left: x, top: y }}
      >
        {items.map((item, i) => {
          if (item.separator) {
            return <div key={i} className="my-1 h-px bg-border" />;
          }

          return (
            <button
              key={i}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                ${item.disabled
                  ? "text-text-dim cursor-not-allowed"
                  : item.danger
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-text-primary hover:bg-white/5"
                }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
