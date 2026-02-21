const fs = require("fs");
const path = require("path");

const buttonDir = path.join(__dirname, "../base-css/button");
const outFile = path.join(
  __dirname,
  "../src/tools/button-styles/button-data.ts"
);

// ===== BUTTON MAIN (existing) =====
const mainAnimationsCSS = fs.readFileSync(
  path.join(buttonDir, "animations.css"),
  "utf8"
);
const mainDefaults = JSON.parse(
  fs.readFileSync(path.join(buttonDir, "defaults.json"), "utf8")
);

// ===== FOOTER LINK =====
const footerLinkCSS = fs.readFileSync(
  path.join(buttonDir, "footer-link.css"),
  "utf8"
);
const footerLinkConfig = JSON.parse(
  fs.readFileSync(path.join(buttonDir, "footer-link.json"), "utf8")
);

// ===== ACCESSORY =====
const accessoryCSS = fs.readFileSync(
  path.join(buttonDir, "accessory.css"),
  "utf8"
);
const accessoryConfig = JSON.parse(
  fs.readFileSync(path.join(buttonDir, "accessory.json"), "utf8")
);

// Parse animations from CSS for a given wrapper selector pattern
function parseAnimations(css, sourceAttr, wrapperPattern) {
  const escapedAttr = sourceAttr.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const animationTypeRegex = new RegExp(
    `${wrapperPattern}\\[${escapedAttr}=["']([^"']+)["']\\]`,
    "g"
  );
  const detectedTypes = new Set();
  let match;

  while ((match = animationTypeRegex.exec(css)) !== null) {
    detectedTypes.add(match[1]);
  }

  const animations = {};

  detectedTypes.forEach((animationType) => {
    const animCSS = extractAnimationCSS(
      css,
      animationType,
      sourceAttr,
      wrapperPattern
    );
    animations[animationType] = {
      name: animationType,
      css: animCSS,
    };
  });

  return animations;
}

// Extract CSS for a specific animation type
function extractAnimationCSS(fullCSS, animationType, sourceAttr, wrapperPattern) {
  const escapedAttr = sourceAttr.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const lines = fullCSS.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const selectorRegex = new RegExp(
      `${wrapperPattern}\\[${escapedAttr}=["']${animationType}["']\\]`
    );

    if (selectorRegex.test(line) && line.includes("{")) {
      const blockLines = [line];
      let braceCount =
        (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      i++;

      while (i < lines.length && braceCount > 0) {
        const blockLine = lines[i];
        blockLines.push(blockLine);
        braceCount += (blockLine.match(/\{/g) || []).length;
        braceCount -= (blockLine.match(/\}/g) || []).length;
        i++;
      }

      blocks.push(blockLines.join("\n"));
    } else {
      i++;
    }
  }

  return blocks.length > 0 ? blocks.join("\n\n") : "";
}

// Extract defaults CSS (everything not part of animation blocks)
function extractDefaultsCSS(fullCSS, sourceAttr) {
  const escapedAttr = sourceAttr.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const lines = fullCSS.split("\n");
  const defaultsLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const animationSelectorRegex = new RegExp(
      `\\[${escapedAttr}=["']([^"']+)["']\\]`
    );

    const isCommentBeforeAnimation =
      line.trim().startsWith("/*") &&
      i + 1 < lines.length &&
      animationSelectorRegex.test(lines[i + 1]);

    if (animationSelectorRegex.test(line) && line.includes("{")) {
      let braceCount =
        (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      i++;

      while (i < lines.length && braceCount > 0) {
        const blockLine = lines[i];
        braceCount += (blockLine.match(/\{/g) || []).length;
        braceCount -= (blockLine.match(/\}/g) || []).length;
        i++;
      }
    } else if (isCommentBeforeAnimation) {
      i++;
    } else {
      defaultsLines.push(line);
      i++;
    }
  }

  return defaultsLines.join("\n").trim();
}

// ===== Process Button Main =====
const mainSourceAttr = mainDefaults.sourceAttribute;
const mainAnimations = parseAnimations(
  mainAnimationsCSS,
  mainSourceAttr,
  "\\.button_wrap"
);
const mainDefaultsCSS = extractDefaultsCSS(mainAnimationsCSS, mainSourceAttr);

// ===== Process Accessory =====
const accessorySourceAttr = accessoryConfig.sourceAttribute;

// Parse animations for each accessory component
const accessoryAnimations = {};
for (const [compName, compConfig] of Object.entries(accessoryConfig.components)) {
  const wrapperPattern = compConfig.wrapperClass.replace(".", "\\.");
  accessoryAnimations[compName] = parseAnimations(
    accessoryCSS,
    accessorySourceAttr,
    wrapperPattern
  );
}

const accessoryDefaultsCSS = extractDefaultsCSS(accessoryCSS, accessorySourceAttr);

// ===== Output TypeScript =====
const output = `// Auto-generated button styles data - do not edit directly
// Edit files in base-css/button/ and run npm run bundle:button

export interface ButtonAnimation {
  name: string;
  css: string;
}

export interface ButtonMainDefaults {
  sourceAttribute: string;
  targetAttribute: string;
  buttonTypes: string[];
  defaultAnimations: Record<string, string>;
}

export interface AccessoryComponent {
  targetAttribute: string;
  wrapperClass: string;
  variants: string[];
  defaultAnimation: string;
}

export interface AccessoryConfig {
  type: string;
  hasMapping: boolean;
  sourceAttribute: string;
  components: Record<string, AccessoryComponent>;
}

// ===== BUTTON MAIN =====
export const buttonDefaults: ButtonMainDefaults = ${JSON.stringify(mainDefaults, null, 2)};
export const buttonAnimations: Record<string, ButtonAnimation> = ${JSON.stringify(mainAnimations, null, 2)};
export const buttonDefaultsCSS = ${JSON.stringify(mainDefaultsCSS)};

// ===== FOOTER LINK =====
export const footerLinkCSS = ${JSON.stringify(footerLinkCSS)};

// ===== ACCESSORY =====
export const accessoryConfig: AccessoryConfig = ${JSON.stringify(accessoryConfig, null, 2)};
export const accessoryAnimations: Record<string, Record<string, ButtonAnimation>> = ${JSON.stringify(accessoryAnimations, null, 2)};
export const accessoryDefaultsCSS = ${JSON.stringify(accessoryDefaultsCSS)};
`;

// Ensure directory exists
const dir = path.dirname(outFile);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outFile, output);

const mainCount = Object.keys(mainAnimations).length;
const accessoryCount = Object.values(accessoryAnimations).reduce(
  (sum, anims) => sum + Object.keys(anims).length,
  0
);
console.log(
  `Button styles bundled: ${mainCount} main animations, ${accessoryCount} accessory animations, 1 footer link`
);
