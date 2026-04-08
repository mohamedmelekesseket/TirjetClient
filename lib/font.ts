// NOTE:
// We intentionally avoid `next/font/google` here because it downloads fonts at build time.
// In some environments (offline builds, restricted CI), that fails and breaks `next build`.
// Use CSS variables + system font stacks instead; you can swap to local fonts later if desired.

export const fontSans = {
  className: "",
  variable: "--font-sans",
} as const;

export const fontDisplay = {
  className: "",
  variable: "--font-display",
} as const;
