import React, { useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ResultCard } from "../components/ResultCard";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP } from "../constants/layout";
import { BUSINESS_TEMPLATES } from "../constants/businessTemplates";

export default function BusinessTemplatesScreen() {
  const colors = useColors();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");

  const template = BUSINESS_TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleGenerate = useCallback(() => {
    if (!template) return;
    const generated = template.generate(values);
    setResult(generated);
  }, [template, values]);

  const handleReset = useCallback(() => {
    setSelectedTemplate(null);
    setValues({});
    setResult("");
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Business Templates
            </Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            SELECT TEMPLATE
          </Text>
          <View style={styles.templateGrid}>
            {BUSINESS_TEMPLATES.map((tpl) => (
              <Pressable
                key={tpl.id}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor:
                      selectedTemplate === tpl.id ? `${colors.primary}20` : colors.card,
                    borderColor: selectedTemplate === tpl.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedTemplate(tpl.id);
                  setValues({});
                  setResult("");
                }}
              >
                <Text style={styles.templateEmoji}>{tpl.emoji}</Text>
                <Text
                  style={[
                    styles.templateTitle,
                    {
                      color: selectedTemplate === tpl.id ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {tpl.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Form fields */}
        {template ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              FILL IN DETAILS
            </Text>
            {template.fields.map((field) => (
              <View key={field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  {field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.foreground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  placeholder={field}
                  placeholderTextColor={colors.mutedForeground}
                  value={values[field] ?? ""}
                  onChangeText={(v) => setValues((prev) => ({ ...prev, [field]: v }))}
                  returnKeyType="next"
                />
              </View>
            ))}
            <Pressable
              style={[
                styles.generateBtn,
                {
                  backgroundColor: template.fields.some((f) => !values[f]?.trim())
                    ? colors.muted
                    : colors.primary,
                },
              ]}
              onPress={handleGenerate}
              disabled={template.fields.some((f) => !values[f]?.trim())}
            >
              <Feather name="zap" size={18} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Generate Message</Text>
            </Pressable>
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>
                Choose Different Template
              </Text>
            </Pressable>
          </View>
        ) : null}

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

  /* Content Sections */
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  templateCard: {
    alignItems: "center",
    width: "48%",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    borderWidth: 1,
    gap: 4,
  },
  templateEmoji: { fontSize: 24 },
  templateTitle: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: SPACING.sm,
  },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: SPACING.md,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    marginTop: SPACING.sm,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  resetBtn: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
