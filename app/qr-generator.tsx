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
import { Header } from "../components/Header";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { COUNTRIES } from "../constants/countries";
import { addHistory } from "../lib/storage";

export default function QrGeneratorScreen() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [generatedUrl, setGeneratedUrl] = useState("");

  const handleGenerate = useCallback(() => {
    if (!phone.trim()) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const encoded = message.trim() ? encodeURIComponent(message.trim()) : "";
    const url = encoded
      ? `https://wa.me/${selectedCountry.dial.replace("+", "")}${cleanPhone}?text=${encoded}`
      : `https://wa.me/${selectedCountry.dial.replace("+", "")}${cleanPhone}`;
    setGeneratedUrl(url);
  }, [phone, message, selectedCountry]);

  const handleShare = useCallback(async () => {
    if (!generatedUrl) return;
    const { Linking } = require("react-native");
    await Linking.openURL(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`,
    );
    addHistory("QR Generator", generatedUrl);
  }, [generatedUrl]);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="QR Generator" subtitle="QR codes for WhatsApp" />
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
            <Feather name="grid" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Generate QR Code</Text>
          </Pressable>
        </View>

        {generatedUrl ? (
          <View style={styles.resultSection}>
            <View
              style={[
                styles.qrPreview,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="grid" size={48} color={colors.primary} />
              <Text style={[styles.qrHint, { color: colors.mutedForeground }]}>
                QR Code Preview
              </Text>
            </View>
            <Text style={[styles.urlText, { color: colors.primary }]} selectable numberOfLines={2}>
              {generatedUrl}
            </Text>
            <Pressable
              style={[styles.shareBtn, { backgroundColor: colors.primary }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={16} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Save QR Code</Text>
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
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  qrPreview: {
    width: 200,
    height: 200,
    borderRadius: RADIUS,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  qrHint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  urlText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
