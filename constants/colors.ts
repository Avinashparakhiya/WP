export type Colors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  inputBorder: string;
  tabBackground: string;
  statusBar: string;
};

export const lightColors: Colors = {
  background: "#F0F2F5",
  foreground: "#111B21",
  card: "#FFFFFF",
  cardForeground: "#111B21",
  primary: "#25D366",
  primaryForeground: "#FFFFFF",
  secondary: "#128C7E",
  secondaryForeground: "#FFFFFF",
  muted: "#F0F2F5",
  mutedForeground: "#8696A0",
  destructive: "#FF3B30",
  destructiveForeground: "#FFFFFF",
  border: "#E9EDEF",
  inputBorder: "#CED0D1",
  tabBackground: "#FFFFFF",
  statusBar: "#075E54",
};

export const darkColors: Colors = {
  background: "#111B21",
  foreground: "#E9EDEF",
  card: "#1F2C34",
  cardForeground: "#E9EDEF",
  primary: "#00A884",
  primaryForeground: "#111B21",
  secondary: "#2A3942",
  secondaryForeground: "#E9EDEF",
  muted: "#2A3942",
  mutedForeground: "#8696A0",
  destructive: "#FF453A",
  destructiveForeground: "#FFFFFF",
  border: "#2A3942",
  inputBorder: "#3B4A54",
  tabBackground: "#1F2C34",
  statusBar: "#0B141A",
};

/** Category accent colors */
export const categoryColors = {
  ai: "#7C3AED",
  whatsapp: "#25D366",
  text: "#F59E0B",
  content: "#EF4444",
} as const;

export type CategoryColor = keyof typeof categoryColors;
