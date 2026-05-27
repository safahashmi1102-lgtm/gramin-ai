/** Design tokens ported from the web app (styles.css) */
export const colors = {
  background: "#FAF9F6",
  foreground: "#3D3429",
  card: "#FFFFFF",
  primary: "#3D7A5C",
  primaryForeground: "#FAF9F6",
  secondary: "#F2F0EA",
  secondaryForeground: "#4A4238",
  muted: "#F2F0EA",
  mutedForeground: "#7A7168",
  accent: "#D4844A",
  accentForeground: "#FAF9F6",
  success: "#4A9D6E",
  warning: "#E8B84A",
  border: "#E5E2DA",
  topo: "#E8F0E8",
  stone200: "#E7E5E4",
  stone100: "#F5F5F4",
  amber50: "#FFFBEB",
  river: "rgba(100, 160, 200, 0.7)",
  trail: "rgba(120, 110, 90, 0.45)",
  surveyFill: "rgba(61, 122, 92, 0.12)",
  surveyStroke: "rgba(61, 122, 92, 0.5)",
} as const;

export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
};
