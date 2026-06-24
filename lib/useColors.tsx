import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors, type Colors } from "../constants/colors";

export type ThemePreference = "system" | "light" | "dark";

type ThemeContextType = {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  activeTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_PREF_KEY = "theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">(
    systemScheme === "dark" ? "dark" : "light",
  );

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemePreferenceState(saved);
        }
      } catch (e) {
        console.error("Failed to load theme preference", e);
      }
    })();
  }, []);

  // Compute active theme whenever preference or system theme changes
  useEffect(() => {
    if (themePreference === "system") {
      setActiveTheme(systemScheme === "dark" ? "dark" : "light");
    } else {
      setActiveTheme(themePreference);
    }
  }, [themePreference, systemScheme]);

  const setThemePreference = async (pref: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, pref);
      setThemePreferenceState(pref);
    } catch (e) {
      console.error("Failed to save theme preference", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): Colors {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if not wrapped in ThemeProvider
    const systemScheme = useColorScheme();
    return systemScheme === "dark" ? darkColors : lightColors;
  }
  return context.activeTheme === "dark" ? darkColors : lightColors;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
