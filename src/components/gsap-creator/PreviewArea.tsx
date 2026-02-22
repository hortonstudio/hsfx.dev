"use client";

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import type { GsapPresetConfig, PlaybackState } from "@/lib/gsap-creator/types";
import { renderScene } from "@/lib/gsap-creator/scene-elements";
import { PREVIEW_TEMPLATES, DEFAULT_TEMPLATE } from "@/lib/gsap-creator/preview-templates";
import { PlaybackControls } from "./PlaybackControls";
import type { PlayheadHandle } from "./Playhead";

export interface PreviewAreaHandle {
  seek: (time: number) => void;
  scrub: (time: number) => void;
}

interface PreviewAreaProps {
  config: GsapPresetConfig;
  playback: PlaybackState;
  onPlaybackChange: (updates: Partial<PlaybackState>) => void;
  playheadRef: React.RefObject<PlayheadHandle | null>;
  onRemoveSceneElement?: (elementId: string) => void;
  onAddSceneElement?: (type: string) => void;
  onSceneLayoutChange?: (layout: "column" | "center" | "grid") => void;
}

const PALETTE_ITEMS = [
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Text" },
  { type: "card", label: "Card" },
  { type: "box", label: "Box" },
  { type: "button", label: "Button" },
  { type: "badge", label: "Badge" },
  { type: "image", label: "Image" },
  { type: "list-item", label: "List" },
  { type: "divider", label: "Line" },
];

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
  function PreviewArea(
    {
      config,
      playback,
      onPlaybackChange,
      playheadRef,
      onRemoveSceneElement,
      onAddSceneElement,
      onSceneLayoutChange,
    },
    ref
  ) {
    const sandboxRef = useRef<HTMLDivElement>(null);
    const sandboxContainerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timelineRef = useRef<any>(null);
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [gsapLoaded, setGsapLoaded] = useState(false);
    const [sceneMode, setSceneMode] = useState<"templates" | "custom">(
      config.scene ? "custom" : "templates"
    );

    // Hover state for element interaction overlay
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
    const [sandboxBounds, setSandboxBounds] = useState<DOMRect | null>(null);

    // Expose seek and scrub handles
    useImperativeHandle(ref, () => ({
      seek(time: number) {
        const tl = timelineRef.current;
        if (!tl) return;
        tl.pause();
        tl.time(time);
        onPlaybackChange({ isPlaying: false, currentTime: time });
      },
      scrub(time: number) {
        const tl = timelineRef.current;
        if (!tl) return;
        tl.pause();
        tl.time(time);
      },
    }));

    // Load GSAP + ScrollTrigger from CDN
    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gsap = (window as any).gsap;
      if (gsap) {
        // GSAP already loaded, check for ScrollTrigger
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ST = (window as any).ScrollTrigger;
        if (ST) {
          gsap.registerPlugin(ST);
          setGsapLoaded(true);
        } else {
          const stScript = document.createElement("script");
          stScript.src = "https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js";
          stScript.onload = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const loadedST = (window as any).ScrollTrigger;
            if (loadedST) gsap.registerPlugin(loadedST);
            setGsapLoaded(true);
          };
          document.head.appendChild(stScript);
        }
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js";
      script.onload = () => {
        // Also load ScrollTrigger
        const stScript = document.createElement("script");
        stScript.src = "https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js";
        stScript.onload = () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const g = (window as any).gsap;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedST = (window as any).ScrollTrigger;
          if (g && loadedST) g.registerPlugin(loadedST);
          setGsapLoaded(true);
        };
        document.head.appendChild(stScript);
      };
      document.head.appendChild(script);
      return () => {
        script.remove();
      };
    }, []);

    // Element hover interaction overlay
    useEffect(() => {
      const sandbox = sandboxRef.current;
      if (!sandbox || !config.scene || playback.isPlaying) {
        setHoveredElementId(null);
        setHoverRect(null);
        return;
      }

      const handleMouseOver = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest("[data-scene-id]");
        if (target) {
          setHoveredElementId(target.getAttribute("data-scene-id"));
          setHoverRect(target.getBoundingClientRect());
          // Update sandbox bounds for positioning
          const container = sandboxContainerRef.current;
          if (container) {
            setSandboxBounds(container.getBoundingClientRect());
          }
        }
      };
      const handleMouseOut = (e: MouseEvent) => {
        const related = (e.relatedTarget as HTMLElement)?.closest?.("[data-scene-id]");
        if (!related) {
          setHoveredElementId(null);
          setHoverRect(null);
        }
      };

      sandbox.addEventListener("mouseover", handleMouseOver);
      sandbox.addEventListener("mouseout", handleMouseOut);
      return () => {
        sandbox.removeEventListener("mouseover", handleMouseOver);
        sandbox.removeEventListener("mouseout", handleMouseOut);
      };
    }, [config.scene, playback.isPlaying]);

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

      // Reset sandbox HTML - use scene if available, otherwise use template
      if (config.scene) {
        sandboxRef.current.innerHTML = renderScene(config.scene);
      } else {
        const tmpl = PREVIEW_TEMPLATES.find((t) => t.id === template) || PREVIEW_TEMPLATES[0];
        sandboxRef.current.innerHTML = tmpl.html;
      }

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

      // Apply ScrollTrigger config if applicable
      if (config.trigger.type === "scrollTrigger" && config.trigger.scrollTrigger) {
        const st = config.trigger.scrollTrigger;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scrollTriggerOpts: any = {
          trigger: sandboxRef.current.querySelector(st.trigger) || sandboxRef.current,
          start: st.start || "top 80%",
          end: st.end || "bottom 20%",
          scroller: sandboxRef.current.parentElement, // the scrollable container
          markers: st.markers,
          toggleActions: st.toggleActions || "play none none reverse",
        };
        if (st.scrub) scrollTriggerOpts.scrub = st.scrub;
        if (st.pin) scrollTriggerOpts.pin = true;
        tlOpts.scrollTrigger = scrollTriggerOpts;
      }

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
        if (tl.progress() >= 1) {
          tl.restart();
        } else {
          tl.play();
        }
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

    // Determine if ScrollTrigger is active for layout adjustments
    const isScrollTrigger = config.trigger.type === "scrollTrigger";

    // Look up the animId for the currently hovered element
    const hoveredAnimId = hoveredElementId && config.scene
      ? config.scene.elements.find((el) => el.id === hoveredElementId)?.animId ?? hoveredElementId
      : null;

    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Dual-mode header: Templates vs Custom Scene */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface">
          {/* Mode tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSceneMode("templates")}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                sceneMode === "templates"
                  ? "bg-accent/20 text-accent"
                  : "text-text-dim hover:text-text-muted"
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setSceneMode("custom")}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                sceneMode === "custom"
                  ? "bg-accent/20 text-accent"
                  : "text-text-dim hover:text-text-muted"
              }`}
            >
              Custom
            </button>
          </div>

          {sceneMode === "templates" ? (
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
          ) : (
            <div className="flex items-center gap-2">
              {/* Layout selector */}
              <div className="flex gap-0.5">
                {(["column", "center", "grid"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => onSceneLayoutChange?.(l)}
                    className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                      config.scene?.layout === l
                        ? "bg-accent/20 text-accent"
                        : "text-text-dim hover:text-text-muted"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="h-3 w-px bg-border" />
              {/* Element palette */}
              <div className="flex gap-0.5">
                {PALETTE_ITEMS.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => onAddSceneElement?.(item.type)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-text-dim hover:text-text-muted hover:bg-black/30 transition-colors"
                    title={`Add ${item.label}`}
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sandbox */}
        <div
          ref={sandboxContainerRef}
          className={`flex-1 min-h-0 ${isScrollTrigger ? "overflow-y-auto" : "overflow-hidden"} relative`}
        >
          <div
            ref={sandboxRef}
            className="w-full text-text-primary bg-background"
            style={{
              fontFamily: "inherit",
              minHeight: isScrollTrigger ? "200vh" : "100%",
              height: isScrollTrigger ? "auto" : "100%",
            }}
          />
          {!gsapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
              <span className="text-xs text-text-dim">Loading GSAP...</span>
            </div>
          )}

          {/* Element interaction overlay */}
          {hoveredElementId && hoverRect && sandboxBounds && !playback.isPlaying && config.scene && (
            <div
              className="absolute pointer-events-none border-2 border-accent/50 rounded-md z-10"
              style={{
                left: hoverRect.left - sandboxBounds.left,
                top: hoverRect.top - sandboxBounds.top,
                width: hoverRect.width,
                height: hoverRect.height,
              }}
            >
              <div className="absolute -top-6 left-0 flex items-center gap-1 pointer-events-auto">
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  {hoveredAnimId}
                </span>
                <button
                  onClick={() => onRemoveSceneElement?.(hoveredElementId)}
                  className="w-4 h-4 flex items-center justify-center rounded bg-red-500/80 text-white hover:bg-red-500"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
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
