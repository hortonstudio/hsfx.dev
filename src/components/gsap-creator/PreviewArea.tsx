"use client";

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import type { GsapPresetConfig, PlaybackState } from "@/lib/gsap-creator/types";
import { PREVIEW_TEMPLATES, DEFAULT_TEMPLATE } from "@/lib/gsap-creator/preview-templates";
import { PlaybackControls } from "./PlaybackControls";
import type { PlayheadHandle } from "./Playhead";

export interface PreviewAreaHandle {
  seek: (time: number) => void;
}

interface PreviewAreaProps {
  config: GsapPresetConfig;
  playback: PlaybackState;
  onPlaybackChange: (updates: Partial<PlaybackState>) => void;
  playheadRef: React.RefObject<PlayheadHandle | null>;
}

/** Split text content of matching elements into individual spans */
function splitTextInDOM(
  container: HTMLElement,
  selector: string,
  type: "chars" | "words" | "lines"
): HTMLElement[] {
  const elements = container.querySelectorAll(selector);
  const splitElements: HTMLElement[] = [];

  elements.forEach((el) => {
    const text = el.textContent || "";
    el.innerHTML = "";

    if (type === "chars") {
      for (const char of text) {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.textContent = char === " " ? "\u00A0" : char;
        el.appendChild(span);
        splitElements.push(span);
      }
    } else if (type === "words") {
      const words = text.split(/\s+/).filter(Boolean);
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.textContent = word;
        el.appendChild(span);
        if (i < words.length - 1) {
          const space = document.createElement("span");
          space.style.display = "inline-block";
          space.innerHTML = "&nbsp;";
          el.appendChild(space);
        }
        splitElements.push(span);
      });
    } else if (type === "lines") {
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length <= 1) {
        const span = document.createElement("span");
        span.style.display = "block";
        span.textContent = text.trim();
        el.appendChild(span);
        splitElements.push(span);
      } else {
        lines.forEach((line) => {
          const span = document.createElement("span");
          span.style.display = "block";
          span.textContent = line.trim();
          el.appendChild(span);
          splitElements.push(span);
        });
      }
    }
  });

  return splitElements;
}

export const PreviewArea = forwardRef<PreviewAreaHandle, PreviewAreaProps>(
  function PreviewArea({ config, playback, onPlaybackChange, playheadRef }, ref) {
    const sandboxRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timelineRef = useRef<any>(null);
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [gsapLoaded, setGsapLoaded] = useState(false);

    // Expose seek handle
    useImperativeHandle(ref, () => ({
      seek(time: number) {
        const tl = timelineRef.current;
        if (!tl) return;
        tl.pause();
        tl.time(time);
        onPlaybackChange({ isPlaying: false, currentTime: time });
      },
    }));

    // Load GSAP from CDN
    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).gsap) {
        setGsapLoaded(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js";
      script.onload = () => setGsapLoaded(true);
      document.head.appendChild(script);
      return () => {
        script.remove();
      };
    }, []);

    // Build timeline when config changes
    const buildTimeline = useCallback(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap = (window as any).gsap;
      if (!gsap || !sandboxRef.current) return;

      // Kill previous timeline
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      // Reset sandbox HTML
      const tmpl = PREVIEW_TEMPLATES.find((t) => t.id === template) || PREVIEW_TEMPLATES[0];
      sandboxRef.current.innerHTML = tmpl.html;

      if (config.tweens.length === 0) {
        onPlaybackChange({ duration: 0, currentTime: 0 });
        return;
      }

      // Split text preprocessing
      const splitMap = new Map<string, HTMLElement[]>();
      for (const tween of config.tweens) {
        if (tween.splitText?.enabled) {
          const splits = splitTextInDOM(sandboxRef.current, tween.target, tween.splitText.type);
          splitMap.set(tween.id, splits);
          // Apply mask if enabled
          if (tween.splitText.mask) {
            const elements = sandboxRef.current.querySelectorAll(tween.target);
            elements.forEach((el) => {
              (el as HTMLElement).style.overflow = "hidden";
            });
          }
        }
      }

      // Build timeline options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tlOpts: any = {};
      const ts = config.timelineSettings;
      if (ts.defaults.ease !== "power2.out" || ts.defaults.duration !== 0.6) {
        tlOpts.defaults = {};
        if (ts.defaults.ease !== "power2.out") tlOpts.defaults.ease = ts.defaults.ease;
        if (ts.defaults.duration !== 0.6) tlOpts.defaults.duration = ts.defaults.duration;
      }
      if (ts.repeat !== 0) tlOpts.repeat = ts.repeat;
      if (ts.yoyo) tlOpts.yoyo = true;
      if (ts.delay > 0) tlOpts.delay = ts.delay;

      tlOpts.paused = true;
      tlOpts.onUpdate = () => {
        const tl = timelineRef.current;
        if (!tl) return;
        const time = tl.time();
        playheadRef.current?.setTime(time);
      };
      tlOpts.onComplete = () => {
        if (playback.loop && timelineRef.current) {
          timelineRef.current.restart();
        } else {
          onPlaybackChange({ isPlaying: false });
        }
      };

      const tl = gsap.timeline(tlOpts);

      // Add tweens to the timeline
      for (const tween of config.tweens) {
        // Use split elements if available
        const splitElements = splitMap.get(tween.id);
        const target = splitElements && splitElements.length > 0
          ? splitElements
          : sandboxRef.current!.querySelectorAll(tween.target);
        if ((Array.isArray(target) ? target.length : (target as NodeListOf<Element>).length) === 0) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vars: any = {};
        for (const [prop, val] of Object.entries(tween.properties)) {
          const v = val as { from?: number | string; to: number | string; unit?: string };
          const toVal = v.unit && v.unit !== "px" ? `${v.to}${v.unit}` : v.to;
          vars[prop] = toVal;
        }
        vars.duration = tween.duration;
        if (tween.ease) vars.ease = tween.ease;
        if (tween.stagger) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const staggerOpts: any = { each: tween.stagger.each };
          if (tween.stagger.from !== "start") staggerOpts.from = tween.stagger.from;
          if (tween.stagger.ease) staggerOpts.ease = tween.stagger.ease;
          vars.stagger = staggerOpts;
        }

        // Split text stagger overrides regular stagger
        if (tween.splitText?.enabled && tween.splitText.staggerEach > 0) {
          if (typeof vars.stagger === "object" && vars.stagger !== null) {
            vars.stagger.each = tween.splitText.staggerEach;
          } else {
            vars.stagger = { each: tween.splitText.staggerEach };
          }
        }

        const pos = tween.position || undefined;

        if (tween.type === "from") {
          tl.from(target, vars, pos);
        } else if (tween.type === "to") {
          tl.to(target, vars, pos);
        } else if (tween.type === "fromTo") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fromVars: any = {};
          for (const [prop, val] of Object.entries(tween.properties)) {
            const v = val as { from?: number | string; to: number | string; unit?: string };
            if (v.from !== undefined) {
              fromVars[prop] = v.unit && v.unit !== "px" ? `${v.from}${v.unit}` : v.from;
            }
          }
          tl.fromTo(target, fromVars, vars, pos);
        } else if (tween.type === "set") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const setVars = { ...vars };
          delete setVars.duration;
          delete setVars.ease;
          tl.set(target, setVars, pos);
        }
      }

      timelineRef.current = tl;
      onPlaybackChange({ duration: tl.duration(), currentTime: 0 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, template, gsapLoaded]);

    // Debounced rebuild
    useEffect(() => {
      const timeout = setTimeout(buildTimeline, 150);
      return () => clearTimeout(timeout);
    }, [buildTimeline]);

    // Play/pause control
    useEffect(() => {
      const tl = timelineRef.current;
      if (!tl) return;

      tl.timeScale(playback.speed);

      if (playback.isPlaying) {
        tl.play();
      } else {
        tl.pause();
        onPlaybackChange({ currentTime: tl.time() });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playback.isPlaying, playback.speed]);

    const handlePlay = () => onPlaybackChange({ isPlaying: true });
    const handlePause = () => onPlaybackChange({ isPlaying: false });
    const handleRestart = () => {
      if (timelineRef.current) {
        timelineRef.current.restart();
        timelineRef.current.pause();
      }
      onPlaybackChange({ isPlaying: false, currentTime: 0 });
      playheadRef.current?.setTime(0);
    };
    const handleToggleLoop = () => onPlaybackChange({ loop: !playback.loop });
    const handleSpeedChange = (speed: number) => onPlaybackChange({ speed });

    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Template selector */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface">
          <span className="text-[10px] text-text-dim uppercase tracking-wider">Preview</span>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="h-6 px-2 text-[11px] text-text-muted bg-black/20 border border-border rounded
              focus:outline-none focus:border-accent/50"
          >
            {PREVIEW_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sandbox */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <div
            ref={sandboxRef}
            className="w-full h-full text-text-primary bg-background"
            style={{ fontFamily: "inherit" }}
          />
          {!gsapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
              <span className="text-xs text-text-dim">Loading GSAP...</span>
            </div>
          )}
        </div>

        {/* Playback controls */}
        <PlaybackControls
          playback={playback}
          onPlay={handlePlay}
          onPause={handlePause}
          onRestart={handleRestart}
          onToggleLoop={handleToggleLoop}
          onSpeedChange={handleSpeedChange}
        />
      </div>
    );
  }
);
