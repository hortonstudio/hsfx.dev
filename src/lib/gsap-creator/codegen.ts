import type { GsapPresetConfig, Tween, AnimatedProperty, GeneratedCode } from "./types";
import { indent, formatCode, formatValue, minifyJS, escapeString } from "./formatter";

export function generateCode(config: GsapPresetConfig, name: string): GeneratedCode {
  const timelineOnly = generateTimelineCode(config);
  const importsOnly = generateImports(config);
  const full = generateFullCode(config, name);
  const minified = minifyJS(full);
  const configJson = JSON.stringify(config, null, 2);

  return { full, timelineOnly, importsOnly, minified, configJson };
}

function needsScrollTrigger(config: GsapPresetConfig): boolean {
  return config.trigger.type === "scrollTrigger" && !!config.trigger.scrollTrigger;
}

function needsSplitText(config: GsapPresetConfig): boolean {
  return config.tweens.some((t) => t.splitText?.enabled);
}

function generateImports(config: GsapPresetConfig): string {
  const plugins: string[] = [];
  if (needsScrollTrigger(config)) plugins.push("ScrollTrigger");

  if (plugins.length === 0) return "";

  return `gsap.registerPlugin(${plugins.join(", ")});`;
}

function buildVarsObject(tween: Tween, isFrom: boolean): string[] {
  const lines: string[] = [];

  for (const [prop, val] of Object.entries(tween.properties)) {
    const av = val as AnimatedProperty;
    const value = isFrom ? (av.from ?? av.to) : av.to;
    lines.push(`${prop}: ${formatValue(value, av.unit)},`);
  }

  lines.push(`duration: ${tween.duration},`);

  if (tween.ease !== "power2.out") {
    lines.push(`ease: "${tween.ease}",`);
  }

  if (tween.stagger) {
    const staggerParts: string[] = [];
    staggerParts.push(`each: ${tween.stagger.each}`);
    if (tween.stagger.from !== "start") {
      staggerParts.push(`from: "${tween.stagger.from}"`);
    }
    if (tween.stagger.ease && tween.stagger.ease !== "power1.out") {
      staggerParts.push(`ease: "${tween.stagger.ease}"`);
    }
    if (tween.stagger.grid) {
      staggerParts.push(`grid: [${tween.stagger.grid[0]}, ${tween.stagger.grid[1]}]`);
    }
    lines.push(`stagger: { ${staggerParts.join(", ")} },`);
  }

  return lines;
}

function generateTweenCode(tween: Tween, indentLevel: number): string[] {
  const lines: string[] = [];
  const target = tween.splitText?.enabled
    ? `split_${tween.id.slice(0, 8)}.${tween.splitText.type}`
    : `"${escapeString(tween.target)}"`;

  const pos = tween.position ? `, "${tween.position}"` : "";

  if (tween.type === "set") {
    const vars = buildVarsObject(tween, false);
    // Remove duration for set
    const filteredVars = vars.filter((l) => !l.startsWith("duration:"));
    lines.push(indent(indentLevel, `tl.set(${target}, {`));
    for (const v of filteredVars) lines.push(indent(indentLevel + 1, v));
    lines.push(indent(indentLevel, `}${pos});`));
  } else if (tween.type === "fromTo") {
    const fromVars = buildVarsObject(tween, true);
    const toVars = buildVarsObject(tween, false);
    // fromTo: from object has no duration/ease/stagger, to object has them
    const fromFiltered = fromVars.filter(
      (l) => !l.startsWith("duration:") && !l.startsWith("ease:") && !l.startsWith("stagger:")
    );
    lines.push(indent(indentLevel, `tl.fromTo(${target}, {`));
    for (const v of fromFiltered) lines.push(indent(indentLevel + 1, v));
    lines.push(indent(indentLevel, `}, {`));
    for (const v of toVars) lines.push(indent(indentLevel + 1, v));
    lines.push(indent(indentLevel, `}${pos});`));
  } else {
    // from or to
    const vars = buildVarsObject(tween, tween.type === "from");
    lines.push(indent(indentLevel, `tl.${tween.type}(${target}, {`));
    for (const v of vars) lines.push(indent(indentLevel + 1, v));
    lines.push(indent(indentLevel, `}${pos});`));
  }

  return lines;
}

function generateSplitTextCode(tween: Tween, indentLevel: number): string[] {
  if (!tween.splitText?.enabled) return [];
  const lines: string[] = [];
  const varName = `split_${tween.id.slice(0, 8)}`;
  const splitType = tween.splitText.type;

  lines.push(indent(indentLevel, `// Split text: ${tween.target}`));
  lines.push(indent(indentLevel, `const ${varName} = { ${splitType}: [] };`));
  lines.push(indent(indentLevel, `document.querySelectorAll("${escapeString(tween.target)}").forEach((el) => {`));
  lines.push(indent(indentLevel + 1, `const text = el.textContent || "";`));

  if (splitType === "chars") {
    lines.push(indent(indentLevel + 1, `el.innerHTML = text.split("").map((c) =>`));
    lines.push(indent(indentLevel + 2, `c === " " ? " " : \`<span style="display:inline-block${tween.splitText.mask ? ";overflow:hidden" : ""}">\${c}</span>\``));
    lines.push(indent(indentLevel + 1, `).join("");`));
    lines.push(indent(indentLevel + 1, `${varName}.${splitType}.push(...el.querySelectorAll("span"));`));
  } else if (splitType === "words") {
    lines.push(indent(indentLevel + 1, `el.innerHTML = text.split(/\\s+/).map((w) =>`));
    lines.push(indent(indentLevel + 2, `\`<span style="display:inline-block${tween.splitText.mask ? ";overflow:hidden" : ""}"><span style="display:inline-block">\${w}</span></span>\``));
    lines.push(indent(indentLevel + 1, `).join(" ");`));
    lines.push(indent(indentLevel + 1, `${varName}.${splitType}.push(...el.querySelectorAll("span > span"));`));
  } else {
    // lines
    lines.push(indent(indentLevel + 1, `el.innerHTML = text.split(/\\n/).map((line) =>`));
    lines.push(indent(indentLevel + 2, `\`<div style="overflow:hidden"><span style="display:block">\${line}</span></div>\``));
    lines.push(indent(indentLevel + 1, `).join("");`));
    lines.push(indent(indentLevel + 1, `${varName}.${splitType}.push(...el.querySelectorAll("div > span"));`));
  }

  lines.push(indent(indentLevel, `});`));
  return lines;
}

function generateTimelineCode(config: GsapPresetConfig): string {
  const lines: string[] = [];
  const { timelineSettings: ts, trigger } = config;
  const indentLevel = 0;

  // Split text declarations
  for (const tween of config.tweens) {
    const splitLines = generateSplitTextCode(tween, indentLevel);
    if (splitLines.length) {
      lines.push(...splitLines);
      lines.push("");
    }
  }

  // Timeline creation
  const tlOptions: string[] = [];

  if (ts.defaults.ease !== "power2.out" || ts.defaults.duration !== 0.6) {
    const defaultParts: string[] = [];
    if (ts.defaults.ease !== "power2.out") defaultParts.push(`ease: "${ts.defaults.ease}"`);
    if (ts.defaults.duration !== 0.6) defaultParts.push(`duration: ${ts.defaults.duration}`);
    tlOptions.push(`defaults: { ${defaultParts.join(", ")} }`);
  }

  if (ts.repeat !== 0) tlOptions.push(`repeat: ${ts.repeat}`);
  if (ts.yoyo) tlOptions.push(`yoyo: true`);
  if (ts.delay > 0) tlOptions.push(`delay: ${ts.delay}`);

  if (needsScrollTrigger(config) && trigger.scrollTrigger) {
    const st = trigger.scrollTrigger;
    const stParts: string[] = [];
    stParts.push(`trigger: "${escapeString(st.trigger)}"`);
    stParts.push(`start: "${st.start}"`);
    stParts.push(`end: "${st.end}"`);
    if (st.scrub !== false) stParts.push(`scrub: ${st.scrub}`);
    if (st.pin) stParts.push(`pin: true`);
    if (st.toggleActions !== "play none none reverse") {
      stParts.push(`toggleActions: "${st.toggleActions}"`);
    }
    if (st.markers) stParts.push(`markers: true`);
    tlOptions.push(`scrollTrigger: {\n    ${stParts.join(",\n    ")}\n  }`);
  }

  if (tlOptions.length > 0) {
    lines.push(indent(indentLevel, `const tl = gsap.timeline({`));
    for (const opt of tlOptions) {
      lines.push(indent(indentLevel + 1, `${opt},`));
    }
    lines.push(indent(indentLevel, `});`));
  } else {
    lines.push(indent(indentLevel, `const tl = gsap.timeline();`));
  }

  lines.push("");

  // Tween calls
  for (const tween of config.tweens) {
    if (tween.label) {
      lines.push(indent(indentLevel, `tl.addLabel("${escapeString(tween.label)}");`));
    }
    lines.push(...generateTweenCode(tween, indentLevel));
    lines.push("");
  }

  return formatCode(lines).trimEnd();
}

function generateFullCode(config: GsapPresetConfig, name: string): string {
  const lines: string[] = [];
  const baseIndent = 1;

  lines.push(`// ${name}`);
  lines.push(`window.hsfx.ready(() => {`);

  // Imports
  const imports = generateImports(config);
  if (imports) {
    lines.push(indent(baseIndent, imports));
    lines.push("");
  }

  // Reduced motion wrapping
  const hasReducedMotion = config.reducedMotion.mode !== "skip";

  if (hasReducedMotion) {
    lines.push(indent(baseIndent, `const mm = gsap.matchMedia();`));
    lines.push("");
    lines.push(indent(baseIndent, `// Full animation`));
    lines.push(indent(baseIndent, `mm.add("(prefers-reduced-motion: no-preference)", () => {`));

    // Full animation code
    const timelineCode = generateTimelineCode(config);
    for (const line of timelineCode.split("\n")) {
      lines.push(indent(baseIndent + 1, line));
    }

    // Cleanup function
    lines.push("");
    lines.push(indent(baseIndent + 1, `return () => { tl.kill(); };`));
    lines.push(indent(baseIndent, `});`));
    lines.push("");

    // Reduced motion branch
    lines.push(indent(baseIndent, `// Reduced motion: ${config.reducedMotion.mode}`));
    lines.push(indent(baseIndent, `mm.add("(prefers-reduced-motion: reduce)", () => {`));

    if (config.reducedMotion.mode === "instant") {
      // Set final state immediately
      for (const tween of config.tweens) {
        const target = `"${escapeString(tween.target)}"`;
        const finalProps: string[] = [];
        for (const [prop, val] of Object.entries(tween.properties)) {
          const av = val as AnimatedProperty;
          finalProps.push(`${prop}: ${formatValue(av.to, av.unit)}`);
        }
        if (finalProps.length) {
          lines.push(indent(baseIndent + 1, `gsap.set(${target}, { ${finalProps.join(", ")} });`));
        }
      }
    }
    // "simplified" mode could be added later with shorter durations

    lines.push(indent(baseIndent, `});`));
  } else {
    // No reduced motion handling — just the timeline
    const timelineCode = generateTimelineCode(config);
    for (const line of timelineCode.split("\n")) {
      lines.push(indent(baseIndent, line));
    }
  }

  // Barba.js cleanup
  const hasSplitText = needsSplitText(config);
  lines.push("");
  lines.push(indent(baseIndent, `// Cleanup on page transition`));
  lines.push(indent(baseIndent, `window.addEventListener("hsfx:transition-exit", () => {`));
  if (hasReducedMotion) {
    lines.push(indent(baseIndent + 1, `mm.revert();`));
  } else {
    lines.push(indent(baseIndent + 1, `tl.kill();`));
  }
  if (hasSplitText) {
    lines.push(indent(baseIndent + 1, `// Revert split text`));
    for (const tween of config.tweens) {
      if (tween.splitText?.enabled) {
        lines.push(indent(baseIndent + 1, `document.querySelectorAll("${escapeString(tween.target)}").forEach((el) => {`));
        lines.push(indent(baseIndent + 2, `el.innerHTML = el.textContent || "";`));
        lines.push(indent(baseIndent + 1, `});`));
      }
    }
  }
  lines.push(indent(baseIndent, `}, { once: true });`));
  lines.push(`});`);

  return formatCode(lines);
}
