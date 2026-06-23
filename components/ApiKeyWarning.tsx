import React, { useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING } from "../constants/layout";
import { getProvider, getGeminiKey, getGroqKey, getApiKey } from "../lib/storage";

interface ApiKeyWarningProps {
  providerOnly?: "gemini" | "groq" | "openai";
}

export function ApiKeyWarning({ providerOnly }: ApiKeyWarningProps) {
  const colors = useColors();
  const router = useRouter();
  const [isMissing, setIsMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const checkKey = async () => {
        const provider = providerOnly ?? (await getProvider());
        let key = "";
        if (provider === "gemini") {
          key = await getGeminiKey();
        } else if (provider === "groq") {
          key = await getGroqKey();
        } else if (provider === "openai") {
          key = await getApiKey();
        }
        if (isMounted) {
          setIsMissing(!key || key.trim().length === 0);
        }
      };
      checkKey();
      return () => {
        isMounted = false;
      };
    }, [providerOnly]),
  );

  if (!isMissing) return null;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: `${colors.destructive}12`,
          borderColor: colors.destructive,
        },
      ]}
      onPress={() => router.push("/settings")}
    >
      <View style={styles.iconContainer}>
        <Feather name="alert-circle" size={20} color={colors.destructive} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.destructive }]}>Invalid API Key</Text>
        <View style={styles.linkContainer}>
          <Text style={[styles.link, { color: colors.primary }]}>Update API key in Settings →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS,
    borderWidth: 1,
    gap: SPACING.sm + 2,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
