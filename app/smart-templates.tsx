import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ResultCard } from "../components/ResultCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AiErrorBox } from "../components/AiErrorBox";
import { ApiKeyWarning } from "../components/ApiKeyWarning";
import { useColors } from "../lib/useColors";
import { chat } from "../lib/openai";
import { addHistory } from "../lib/storage";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP } from "../constants/layout";
import { SMART_TEMPLATE_CATEGORIES } from "../constants/smartTemplates";

export default function SmartTemplatesScreen() {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectTemplate = async (prompt: string, title: string) => {
    setSelectedTemplate(title);
    setLoading(true);
    setError("");
    setResult("");
    try {
      const response = await chat(prompt);
      setResult(response);
      await addHistory("Smart Template", response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("API key not set") && !msg.includes("API key required")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View
            style={[
              styles.header,
              {
                paddingTop: (insets?.top ?? 0) + HEADER_PADDING_TOP,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
              }}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Smart Templates</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── API Key Warning ── */}
        <View style={styles.section}>
          <ApiKeyWarning />
        </View>

        {/* Category selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            SELECT PROFESSION
          </Text>
          <View style={styles.categoryRow}>
            {SMART_TEMPLATE_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor:
                      selectedCategory === cat.id ? `${colors.primary}20` : colors.card,
                    borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: selectedCategory === cat.id ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Templates for selected category */}
        {selectedCategory ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TEMPLATES</Text>
            {SMART_TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)?.templates.map(
              (tpl, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.templateCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: selectedTemplate === tpl.title ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectTemplate(tpl.prompt, tpl.title)}
                  disabled={loading}
                >
                  <View style={styles.templateHeader}>
                    <Feather
                      name="file-text"
                      size={18}
                      color={
                        selectedTemplate === tpl.title ? colors.primary : colors.mutedForeground
                      }
                    />
                    <Text
                      style={[
                        styles.templateTitle,
                        {
                          color:
                            selectedTemplate === tpl.title ? colors.primary : colors.foreground,
                        },
                      ]}
                    >
                      {tpl.title}
                    </Text>
                  </View>
                  <Text style={[styles.templatePreview, { color: colors.mutedForeground }]}>
                    {tpl.prompt.slice(0, 100)}...
                  </Text>
                  {selectedTemplate === tpl.title && loading ? (
                    <LoadingSpinner size="small" />
                  ) : null}
                </Pressable>
              ),
            )}
          </View>
        ) : null}

        {error ? <AiErrorBox error={error} onDismiss={() => setError("")} /> : null}
        {result ? <ResultCard result={result} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  categoryCard: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    borderWidth: 1,
    gap: 4,
    minWidth: 80,
  },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  templateCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  templatePreview: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
