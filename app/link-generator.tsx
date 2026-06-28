import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/useColors";
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";
import { COUNTRIES } from "../constants/countries";
import { addHistory } from "../lib/storage";

const GREEN = "#25D366";

export default function LinkGeneratorScreen() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );
  const [showCountries, setShowCountries] = useState(false);
  const [search, setSearch] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

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
    await addHistory("Link Generator", generatedLink);
  }, [generatedLink]);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setMessage(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Link Generator</Text>
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
        {/* ── Phone Number Card ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              PHONE NUMBER
            </Text>
            <View style={styles.inputRow}>
              {/* Dropdown code selector */}
              <Pressable
                style={[
                  styles.dropdownBtn,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.inputBorder,
                  },
                ]}
                onPress={() => setShowCountries(true)}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>
                  {selectedCountry.dial}
                </Text>
                <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
              </Pressable>

              {/* Phone number input */}
              <TextInput
                style={[
                  styles.phoneInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="Phone number"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* ── Pre-filled Message Card ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                PRE-FILLED MESSAGE (OPTIONAL)
              </Text>
              <Pressable onPress={handlePaste} style={styles.pasteBtn} hitSlop={8}>
                <Feather name="clipboard" size={14} color={colors.primary} />
                <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="Enter a message to pre-fill..."
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Generate Button ── */}
        <View style={styles.sectionWrap}>
          <Pressable
            style={[
              styles.generateBtn,
              {
                backgroundColor: !phone.trim() ? `${GREEN}15` : GREEN,
              },
            ]}
            onPress={handleGenerate}
            disabled={!phone.trim()}
          >
            <Feather name="link" size={18} color={!phone.trim() ? `${GREEN}80` : "#FFFFFF"} />
            <Text
              style={[styles.generateBtnText, { color: !phone.trim() ? `${GREEN}80` : "#FFFFFF" }]}
            >
              Generate Link
            </Text>
          </Pressable>
        </View>

        {/* ── Result Card ── */}
        {generatedLink ? (
          <View style={styles.sectionWrap}>
            <View
              style={[
                styles.resultCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                GENERATED LINK
              </Text>
              <Text
                style={[styles.resultValue, { color: colors.primary }]}
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
          </View>
        ) : null}
      </ScrollView>

      {/* ── Country Selection Modal ── */}
      <Modal visible={showCountries} animationType="slide" transparent={false}>
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <View
              style={[
                styles.modalScreen,
                {
                  backgroundColor: colors.background,
                  paddingTop: (insets?.top ?? 0) + 16,
                  paddingBottom: (insets?.bottom ?? 0) + 16,
                },
              ]}
            >
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Select Country
                </Text>
                <Pressable
                  onPress={() => {
                    setShowCountries(false);
                    setSearch("");
                  }}
                  style={styles.closeBtn}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <Feather
                    name="search"
                    size={18}
                    color={colors.mutedForeground}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.modalSearchInput, { color: colors.foreground }]}
                    placeholder="Search country..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Country List */}
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {filteredCountries.map((c) => (
                  <Pressable
                    key={c.code}
                    style={[styles.countryItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedCountry(c);
                      setShowCountries(false);
                      setSearch("");
                    }}
                  >
                    <Text style={styles.countryFlag}>{c.flag}</Text>
                    <Text style={[styles.countryName, { color: colors.foreground }]}>{c.name}</Text>
                    <Text style={[styles.countryDialText, { color: GREEN }]}>{c.dial}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      </Modal>
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

  /* Sections */
  sectionWrap: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },

  /* Card */
  card: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  /* Section Label */
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },

  /* Input Row */
  inputRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    minWidth: 80,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },

  /* Message Input */
  messageInput: {
    minHeight: 100,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  /* Generate Button */
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  /* Result Card */
  resultCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS_SM,
    alignSelf: "flex-start",
    marginTop: SPACING.xs,
  },
  copyText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* Modal Screen */
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  countryDialText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pasteBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
