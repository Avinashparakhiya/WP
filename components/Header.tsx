import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useColors } from "../lib/useColors";
import { HEADER_PADDING_TOP, SPACING } from "../constants/layout";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const colors = useColors();

  return (
    <SafeAreaInsetsContext.Consumer>
      {(insets) => (
        <View
          style={[
            styles.container,
            {
              paddingTop: (insets?.top ?? 0) + HEADER_PADDING_TOP,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          ) : null}
        </View>
      )}
    </SafeAreaInsetsContext.Consumer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
