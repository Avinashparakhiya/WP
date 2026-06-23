import React, { useState } from "react";
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
import { Header } from "../components/Header";
import { ResultCard } from "../components/ResultCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AiErrorBox } from "../components/AiErrorBox";
import { ApiKeyWarning } from "../components/ApiKeyWarning";
import { useColors } from "../lib/useColors";
import { chat } from "../lib/openai";
import { addHistory } from "../lib/storage";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";

const POPULAR_LANGUAGES = [
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Hindi",
  "Arabic",
  "Japanese",
  "Korean",
  "Chinese",
  "Russian",
  "Turkish",
  "Dutch",
  "Swedish",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Urdu",
  "Bengali",
  "Punjabi",
];

export default function AiTranslateScreen() {
  const colors = useColors();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!text.trim() || !language.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const response = await chat(
        `Translate the following text to ${language.trim()}. Only output the translation, nothing else:\n\n"${text.trim()}"`,
      );
      setResult(response);
      await addHistory("AI Translate", `[${language}] ${response}`);
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="AI Translate" subtitle="Translate any language" />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.foreground }]}>Text to translate</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="Enter text to translate..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Target language</Text>
          <TextInput
            style={[
              styles.langInput,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="e.g., Spanish, French, Japanese..."
            placeholderTextColor={colors.mutedForeground}
            value={language}
            onChangeText={setLanguage}
            autoCapitalize="none"
          />

          {/* Quick language chips */}
          <View style={styles.chipsRow}>
            {POPULAR_LANGUAGES.slice(0, 8).map((lang) => (
              <Pressable
                key={lang}
                style={[
                  styles.chip,
                  {
                    backgroundColor: language === lang ? `${colors.primary}20` : colors.card,
                    borderColor: language === lang ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: language === lang ? colors.primary : colors.mutedForeground,
                    },
                  ]}
                >
                  {lang}
                </Text>
              </Pressable>
            ))}
          </View>

          <ApiKeyWarning />

          <Pressable
            style={[styles.button, { backgroundColor: loading ? colors.muted : colors.primary }]}
            onPress={handleTranslate}
            disabled={loading || !text.trim() || !language.trim()}
          >
            {loading ? (
              <LoadingSpinner size="small" color={colors.mutedForeground} />
            ) : (
              <>
                <Feather name="globe" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Translate</Text>
              </>
            )}
          </Pressable>
        </View>

        {error ? <AiErrorBox error={error} onDismiss={() => setError("")} /> : null}
        {result ? <ResultCard result={result} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  inputSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  langInput: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: 48,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
