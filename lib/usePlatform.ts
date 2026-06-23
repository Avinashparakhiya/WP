import { Platform, PlatformIOSStatic } from "react-native";

const iosStatic = Platform as PlatformIOSStatic;

/** True when running on iOS 26+ with Liquid Glass support */
export const isLiquidGlass =
  Platform.OS === "ios" && ((iosStatic.constants as any)?.platformVersion ?? 0) >= 26;

export const isWeb = Platform.OS === "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isMobile = !isWeb;
