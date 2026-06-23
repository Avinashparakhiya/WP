import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Header } from "../components/Header";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { FANCY_TEXT_STYLES } from "../constants/fancyText";

export default function FancyTextScreen() {
  const colors = useColors();
  const [input, setInput] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const results = useMemo(() => {
    if (!input.trim()) return [];
    return FANCY_TEXT_STYLES.map((style, idx) => ({
      name: style.name,
      text: style.convert(input),
      index: idx,
    }));
  }, [input]);

  const handleCopy = async (text: string, idx: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIdx(idx);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="Fancy Text" subtitle="30+ Unicode text styles" />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <View style={styles.inputSection}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.inputBorder,
            },
          ]}
          placeholder="Type your text here..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          returnKeyType="done"
        />
      </View>

      {results.length > 0 ? (
        <View style={styles.resultsSection}>
          {results.map((item) => (
            <Pressable
              key={item.index}
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.card,
                  borderColor: copiedIdx === item.index ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleCopy(item.text, item.index)}
              onLongPress={() => handleCopy(item.text, item.index)}
            >
              <View style={styles.resultHeader}>
                <Text style={[styles.styleName, { color: colors.mutedForeground }]}>
                  {item.name}
                </Text>
                <View style={styles.copyIndicator}>
                  <Feather
                    name={copiedIdx === item.index ? "check" : "copy"}
                    size={14}
                    color={copiedIdx === item.index ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.copyText,
                      {
                        color: copiedIdx === item.index ? colors.primary : colors.mutedForeground,
                      },
                    ]}
                  >
                    {copiedIdx === item.index ? "Copied!" : "Tap to copy"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.resultText, { color: colors.foreground }]} numberOfLines={2}>
                {item.text}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Feather name="type" size={40} color={colors.mutedForeground} />
          <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
            Type something to see it in different styles
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inputSection: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  resultsSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  resultCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  styleName: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  copyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  resultText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
