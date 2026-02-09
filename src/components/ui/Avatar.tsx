"use client";

import { useState } from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
}

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const statusSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-text-dim",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const showFallback = !src || imageError;

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          relative flex items-center justify-center rounded-full overflow-hidden
          bg-surface border border-border
          ${sizeStyles[size]}
        `}
      >
        {showFallback ? (
          <span className="font-medium text-text-muted">
            {fallback ? getInitials(fallback) : "?"}
          </span>
        ) : (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-2 border-background
            ${statusSizes[size]}
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ children, max, size = "md" }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const remainingCount = max ? Math.max(0, childArray.length - max) : 0;

  const sizeStyles = {
    sm: "w-8 h-8 text-xs -ml-2",
    md: "w-10 h-10 text-sm -ml-3",
    lg: "w-12 h-12 text-base -ml-4",
  };

  return (
    <div className="flex items-center">
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={index > 0 ? sizeStyles[size].split(" ").pop() : ""}
          style={{ zIndex: visibleChildren.length - index }}
        >
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            flex items-center justify-center rounded-full
            bg-surface border border-border font-medium text-text-muted
            ${sizeStyles[size]}
          `}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
