"use client";

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const variantStyles = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === "circular" ? "40px" : "100%"),
    height:
      height ?? (variant === "circular" ? "40px" : variant === "text" ? undefined : "100px"),
  };

  return (
    <div
      className={`
        bg-surface animate-pulse
        ${variantStyles[variant]}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  );
}
