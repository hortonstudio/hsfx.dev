"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize, Minimize } from "./Icons";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  caption?: string;
}

export function ImageModal({ src, alt, isOpen, onClose, caption }: ImageModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-text-muted hover:text-text-primary
          bg-surface/50 hover:bg-surface rounded-full transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Zoom toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsZoomed(!isZoomed);
        }}
        className="absolute top-4 right-16 z-10 p-2 text-text-muted hover:text-text-primary
          bg-surface/50 hover:bg-surface rounded-full transition-colors"
        aria-label={isZoomed ? "Zoom out" : "Zoom in"}
      >
        {isZoomed ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      {/* Image container */}
      <div
        className={`relative max-w-[90vw] max-h-[90vh] ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsZoomed(!isZoomed);
        }}
      >
        <img
          src={src}
          alt={alt}
          className={`
            object-contain transition-transform duration-300
            ${isZoomed ? "scale-150" : "scale-100"}
            max-w-[90vw] max-h-[85vh]
          `}
        />

        {/* Caption */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-sm text-center">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  thumbnail?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGallery({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImage = images[currentIndex];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    },
    [onClose, goToPrevious, goToNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen || !currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-text-muted">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            className="p-2 text-text-muted hover:text-text-primary
              bg-surface/50 hover:bg-surface rounded-full transition-colors"
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
          >
            {isZoomed ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary
              bg-surface/50 hover:bg-surface rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center relative px-16">
        {/* Previous button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 p-3 text-text-muted hover:text-text-primary
              bg-surface/50 hover:bg-surface rounded-full transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image */}
        <div
          className={`relative ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
        >
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className={`
              object-contain transition-transform duration-300
              ${isZoomed ? "scale-150" : "scale-100"}
              max-w-[80vw] max-h-[70vh]
            `}
          />
        </div>

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 p-3 text-text-muted hover:text-text-primary
              bg-surface/50 hover:bg-surface rounded-full transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <div className="text-center p-4">
          <p className="text-text-secondary text-sm">{currentImage.caption}</p>
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 p-4 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsZoomed(false);
              }}
              className={`
                w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                ${
                  index === currentIndex
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                }
              `}
            >
              <img
                src={image.thumbnail || image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClickableImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function ClickableImage({ src, alt, caption, className = "" }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative group cursor-zoom-in overflow-hidden rounded-lg ${className}`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Maximize
            size={32}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </button>
      <ImageModal
        src={src}
        alt={alt}
        caption={caption}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
