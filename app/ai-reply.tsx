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

export default function AiReplyScreen() {
  const colors = useColors();
  const [receivedMessage, setReceivedMessage] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!receivedMessage.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const contextPart = context.trim() ? ` Additional context: ${context.trim()}.` : "";
      const response = await chat(
        `You received this WhatsApp message: "${receivedMessage}"${contextPart} Generate 3 professional and friendly reply options. Number them 1, 2, 3. Keep each reply concise and suitable for WhatsApp.`,
      );
      setResult(response);
      await addHistory("AI Reply", response);
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
            <Header title="AI Reply" subtitle="Smart reply suggestions" />
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
          <Text style={[styles.label, { color: colors.foreground }]}>Message you received</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="Paste the message you received..."
            placeholderTextColor={colors.mutedForeground}
            value={receivedMessage}
            onChangeText={setReceivedMessage}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Reply context (optional)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="e.g., This is from my boss, keep it formal..."
            placeholderTextColor={colors.mutedForeground}
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <ApiKeyWarning />

          <Pressable
            style={[styles.button, { backgroundColor: loading ? colors.muted : colors.primary }]}
            onPress={handleGenerate}
            disabled={loading || !receivedMessage.trim()}
          >
            {loading ? (
              <LoadingSpinner size="small" color={colors.mutedForeground} />
            ) : (
              <>
                <Feather name="corner-up-left" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Generate Replies</Text>
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
    minHeight: 80,
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
