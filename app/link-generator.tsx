import React, { useCallback, useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Header } from "../components/Header";
import { useColors } from "../lib/useColors";
import { RADIUS, RADIUS_SM, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { COUNTRIES } from "../constants/countries";
import { addHistory } from "../lib/storage";

export default function LinkGeneratorScreen() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!phone.trim()) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const encoded = message.trim() ? encodeURIComponent(message.trim()) : "";
    const link = encoded
      ? `https://wa.me/${selectedCountry.dial.replace("+", "")}${cleanPhone}?text=${encoded}`
      : `https://wa.me/${selectedCountry.dial.replace("+", "")}${cleanPhone}`;
    setGeneratedLink(link);
    setCopied(false);
  }, [phone, message, selectedCountry]);

  const handleCopy = useCallback(async () => {
    if (!generatedLink) return;
    await Clipboard.setStringAsync(generatedLink);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addHistory("Link Generator", generatedLink);
  }, [generatedLink]);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="Link Generator" subtitle="Create wa.me links" />
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
          {/* Country selector */}
          <Pressable
            style={[
              styles.countryBtn,
              { backgroundColor: colors.card, borderColor: colors.inputBorder },
            ]}
            onPress={() => {
              const idx = COUNTRIES.indexOf(selectedCountry);
              setSelectedCountry(COUNTRIES[(idx + 1) % COUNTRIES.length]);
            }}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={[styles.countryDial, { color: colors.foreground }]}>
              {selectedCountry.name} ({selectedCountry.dial})
            </Text>
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
          </Pressable>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="Phone number"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="Pre-filled message (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <Pressable
            style={[
              styles.button,
              { backgroundColor: !phone.trim() ? colors.muted : colors.primary },
            ]}
            onPress={handleGenerate}
            disabled={!phone.trim()}
          >
            <Feather name="link" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Generate Link</Text>
          </Pressable>
        </View>

        {generatedLink ? (
          <View
            style={[
              styles.resultSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>
              Generated Link
            </Text>
            <Text
              style={[styles.linkValue, { color: colors.primary }]}
              selectable
              numberOfLines={3}
            >
              {generatedLink}
            </Text>
            <Pressable
              style={[
                styles.copyBtn,
                {
                  backgroundColor: copied ? `${colors.primary}20` : `${colors.primary}15`,
                },
              ]}
              onPress={handleCopy}
            >
              <Feather name={copied ? "check" : "copy"} size={16} color={colors.primary} />
              <Text style={[styles.copyText, { color: colors.primary }]}>
                {copied ? "Copied!" : "Copy Link"}
              </Text>
            </Pressable>
          </View>
        ) : null}
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
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  countryFlag: { fontSize: 20 },
  countryDial: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
  resultSection: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS_SM,
    alignSelf: "flex-start",
  },
  copyText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
