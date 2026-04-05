import { Cormorant, Plus_Jakarta_Sans } from "next/font/google";

/** UI, body, navigation */
export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

/** Headings and display text */
export const fontDisplay = Cormorant({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
