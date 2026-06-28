import { Platform } from "react-native";

export const RADIUS = 12;
export const RADIUS_SM = 8;
export const RADIUS_LG = 16;
export const RADIUS_FULL = 999;

export const TAB_BAR_HEIGHT = Platform.select({
  ios: 64,
  android: 64,
  web: 56,
  default: 64,
});

export const CONTENT_BOTTOM_PADDING = Platform.select({
  ios: TAB_BAR_HEIGHT + 20,
  android: TAB_BAR_HEIGHT + 20,
  web: TAB_BAR_HEIGHT + 16,
  default: TAB_BAR_HEIGHT + 20,
});

export const HEADER_PADDING_TOP = Platform.select({
  ios: 16,
  android: 16,
  web: 16,
  default: 16,
});

export const INPUT_HEIGHT = 48;
export const INPUT_HEIGHT_MULTILINE = 120;

/** Spacing scale */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
