export interface EaseOption {
  value: string;
  label: string;
  category: string;
}

export const EASE_CATEGORIES = [
  "Power",
  "Back",
  "Elastic",
  "Bounce",
  "Expo",
  "Circ",
  "Sine",
  "Steps",
  "Special",
] as const;

export const EASES: EaseOption[] = [
  // Power
  { value: "none", label: "Linear (none)", category: "Power" },
  { value: "power1.in", label: "Power1 In", category: "Power" },
  { value: "power1.out", label: "Power1 Out", category: "Power" },
  { value: "power1.inOut", label: "Power1 InOut", category: "Power" },
  { value: "power2.in", label: "Power2 In", category: "Power" },
  { value: "power2.out", label: "Power2 Out", category: "Power" },
  { value: "power2.inOut", label: "Power2 InOut", category: "Power" },
  { value: "power3.in", label: "Power3 In", category: "Power" },
  { value: "power3.out", label: "Power3 Out", category: "Power" },
  { value: "power3.inOut", label: "Power3 InOut", category: "Power" },
  { value: "power4.in", label: "Power4 In", category: "Power" },
  { value: "power4.out", label: "Power4 Out", category: "Power" },
  { value: "power4.inOut", label: "Power4 InOut", category: "Power" },

  // Back
  { value: "back.in", label: "Back In", category: "Back" },
  { value: "back.out", label: "Back Out", category: "Back" },
  { value: "back.inOut", label: "Back InOut", category: "Back" },

  // Elastic
  { value: "elastic.in", label: "Elastic In", category: "Elastic" },
  { value: "elastic.out", label: "Elastic Out", category: "Elastic" },
  { value: "elastic.inOut", label: "Elastic InOut", category: "Elastic" },

  // Bounce
  { value: "bounce.in", label: "Bounce In", category: "Bounce" },
  { value: "bounce.out", label: "Bounce Out", category: "Bounce" },
  { value: "bounce.inOut", label: "Bounce InOut", category: "Bounce" },

  // Expo
  { value: "expo.in", label: "Expo In", category: "Expo" },
  { value: "expo.out", label: "Expo Out", category: "Expo" },
  { value: "expo.inOut", label: "Expo InOut", category: "Expo" },

  // Circ
  { value: "circ.in", label: "Circ In", category: "Circ" },
  { value: "circ.out", label: "Circ Out", category: "Circ" },
  { value: "circ.inOut", label: "Circ InOut", category: "Circ" },

  // Sine
  { value: "sine.in", label: "Sine In", category: "Sine" },
  { value: "sine.out", label: "Sine Out", category: "Sine" },
  { value: "sine.inOut", label: "Sine InOut", category: "Sine" },

  // Steps
  { value: "steps(5)", label: "Steps (5)", category: "Steps" },
  { value: "steps(10)", label: "Steps (10)", category: "Steps" },
  { value: "steps(20)", label: "Steps (20)", category: "Steps" },

  // Special
  { value: "slow(0.7, 0.7, false)", label: "Slow", category: "Special" },
  { value: "rough({ template: none, strength: 1, points: 20, taper: none, randomize: true, clamp: false })", label: "Rough", category: "Special" },
  { value: "expoScale(1, 2)", label: "ExpoScale", category: "Special" },
];

export const DEFAULT_EASE = "power2.out";

/** Group eases by category for dropdown sections */
export function getGroupedEases(): Record<string, EaseOption[]> {
  const groups: Record<string, EaseOption[]> = {};
  for (const ease of EASES) {
    if (!groups[ease.category]) groups[ease.category] = [];
    groups[ease.category].push(ease);
  }
  return groups;
}
