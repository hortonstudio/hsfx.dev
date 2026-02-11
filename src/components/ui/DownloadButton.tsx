"use client";

import { useState } from "react";
import { Download, Apple, Windows, Linux, Check } from "./Icons";

type Platform = "macos" | "windows" | "linux" | "universal";

interface DownloadButtonProps {
  href: string;
  platform?: Platform;
  version?: string;
  fileSize?: string;
  filename?: string;
  className?: string;
  showProgress?: boolean;
}

export function DownloadButton({
  href,
  platform = "universal",
  version,
  fileSize,
  filename,
  className = "",
  showProgress = false,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const platformConfig: Record<Platform, { icon: React.ReactNode; label: string }> = {
    macos: { icon: <Apple size={20} />, label: "Download for macOS" },
    windows: { icon: <Windows size={20} />, label: "Download for Windows" },
    linux: { icon: <Linux size={20} />, label: "Download for Linux" },
    universal: { icon: <Download size={20} />, label: "Download" },
  };

  const { icon, label } = platformConfig[platform];

  const handleClick = () => {
    if (showProgress) {
      setIsDownloading(true);
      setProgress(0);

      // Simulate download progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDownloading(false);
            setIsComplete(true);
            setTimeout(() => setIsComplete(false), 3000);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
    }
  };

  return (
    <a
      href={href}
      download={filename}
      onClick={handleClick}
      className={`
        relative inline-flex items-center gap-3 px-6 py-3
        btn-gradient text-white font-medium rounded-lg
        transition-all overflow-hidden
        ${isDownloading ? "pointer-events-none" : ""}
        ${className}
      `}
    >
      {/* Progress bar background */}
      {showProgress && isDownloading && (
        <div
          className="absolute inset-0 bg-accent-hover/50 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      )}

      {/* Content */}
      <span className="relative flex items-center gap-3">
        {isComplete ? (
          <Check size={20} className="text-white" />
        ) : isDownloading ? (
          <span className="text-sm font-mono">{Math.round(progress)}%</span>
        ) : (
          icon
        )}

        <span className="flex flex-col items-start">
          <span className="text-sm font-semibold">
            {isComplete ? "Downloaded!" : isDownloading ? "Downloading..." : label}
          </span>
          {(version || fileSize) && !isDownloading && !isComplete && (
            <span className="text-xs opacity-80">
              {version && `v${version}`}
              {version && fileSize && " • "}
              {fileSize}
            </span>
          )}
        </span>
      </span>
    </a>
  );
}

// Platform-specific download buttons group
interface DownloadOption {
  platform: Platform;
  href: string;
  fileSize?: string;
}

interface DownloadGroupProps {
  version: string;
  options: DownloadOption[];
  className?: string;
}

export function DownloadGroup({ version, options, className = "" }: DownloadGroupProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {options.map((option) => (
        <DownloadButton
          key={option.platform}
          href={option.href}
          platform={option.platform}
          version={version}
          fileSize={option.fileSize}
        />
      ))}
    </div>
  );
}

// Compact download link
interface DownloadLinkProps {
  href: string;
  children: React.ReactNode;
  fileSize?: string;
  className?: string;
}

export function DownloadLink({
  href,
  children,
  fileSize,
  className = "",
}: DownloadLinkProps) {
  return (
    <a
      href={href}
      download
      className={`
        inline-flex items-center gap-2 text-accent hover:text-accent-hover
        transition-colors group ${className}
      `}
    >
      <Download
        size={16}
        className="transition-transform group-hover:translate-y-0.5"
      />
      <span className="underline underline-offset-2">{children}</span>
      {fileSize && (
        <span className="text-text-muted text-sm">({fileSize})</span>
      )}
    </a>
  );
}

// Card-style download option
interface DownloadCardProps {
  platform: Platform;
  href: string;
  version: string;
  fileSize?: string;
  requirements?: string;
  recommended?: boolean;
  className?: string;
}

export function DownloadCard({
  platform,
  href,
  version,
  fileSize,
  requirements,
  recommended = false,
  className = "",
}: DownloadCardProps) {
  const platformConfig: Record<Platform, { icon: React.ReactNode; name: string }> = {
    macos: { icon: <Apple size={32} />, name: "macOS" },
    windows: { icon: <Windows size={32} />, name: "Windows" },
    linux: { icon: <Linux size={32} />, name: "Linux" },
    universal: { icon: <Download size={32} />, name: "Universal" },
  };

  const { icon, name } = platformConfig[platform];

  return (
    <a
      href={href}
      download
      className={`
        relative block p-6 bg-surface border border-border rounded-xl
        hover:border-accent/50 hover:shadow-glow-sm transition-all group
        ${className}
      `}
    >
      {recommended && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-accent text-white rounded-full">
          Recommended
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="p-3 bg-accent/10 rounded-xl text-accent group-hover:bg-accent group-hover:text-white transition-colors">
          {icon}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">{name}</h3>
          <p className="text-sm text-text-muted mt-1">
            Version {version}
            {fileSize && ` • ${fileSize}`}
          </p>
          {requirements && (
            <p className="text-xs text-text-dim mt-2">{requirements}</p>
          )}
        </div>

        <Download
          size={20}
          className="text-text-muted group-hover:text-accent transition-colors"
        />
      </div>
    </a>
  );
}
