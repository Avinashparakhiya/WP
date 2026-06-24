import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
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
import { EmptyState } from "../components/EmptyState";
import { useColors } from "../lib/useColors";
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";
import { COUNTRIES } from "../constants/countries";
import { getRecentContacts, addRecentContact } from "../lib/storage";

const GREEN = "#25D366";

export default function DirectChatScreen() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );
  const [showCountries, setShowCountries] = useState(false);
  const [search, setSearch] = useState("");
  const [recentContacts, setRecentContacts] = useState<
    { id: string; name?: string; phone: string; countryCode: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const contacts = await getRecentContacts();
      setRecentContacts(contacts);
    })();
  }, []);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenChat = useCallback(async () => {
    if (!phone.trim()) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://wa.me/${selectedCountry.dial.replace("+", "")}${cleanPhone}`;
    await Linking.openURL(url);
    await addRecentContact(phone, selectedCountry.dial);
    const updated = await getRecentContacts();
    setRecentContacts(updated);
  }, [phone, selectedCountry]);

  const handleRecentPress = useCallback(async (contact: (typeof recentContacts)[0]) => {
    const url = `https://wa.me/${contact.countryCode.replace("+", "")}${contact.phone.replace(/\D/g, "")}`;
    await Linking.openURL(url);
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Direct Chat</Text>
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
        {/* ── Phone Input Card ── */}
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
                placeholder="Enter phone number"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>

            <Text style={[styles.selectionText, { color: colors.mutedForeground }]}>
              Selected: {selectedCountry.name} {selectedCountry.dial}
            </Text>

            {/* Generate / Open Chat button inside Card */}
            <Pressable
              style={[
                styles.openBtn,
                {
                  backgroundColor: !phone.trim() ? `${GREEN}15` : GREEN,
                },
              ]}
              onPress={handleOpenChat}
              disabled={!phone.trim()}
            >
              <Feather name="send" size={18} color={!phone.trim() ? `${GREEN}80` : "#FFFFFF"} />
              <Text
                style={[styles.openBtnText, { color: !phone.trim() ? `${GREEN}80` : "#FFFFFF" }]}
              >
                Open WhatsApp
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent contacts */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            RECENT CONTACTS
          </Text>
          {recentContacts.length === 0 ? (
            <EmptyState icon="clock" title="No recent contacts" />
          ) : (
            recentContacts.map((contact) => (
              <Pressable
                key={contact.id}
                style={[
                  styles.contactCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleRecentPress(contact)}
              >
                <View style={styles.contactInfo}>
                  <Feather name="user" size={16} color={GREEN} />
                  <Text style={[styles.contactPhone, { color: colors.foreground }]}>
                    {contact.countryCode} {contact.phone}
                  </Text>
                </View>
                <Feather name="external-link" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))
          )}
        </View>
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
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  selectionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: SPACING.xs,
  },

  /* Open Button */
  openBtn: {
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
    marginTop: SPACING.sm,
  },
  openBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  /* Recents */
  recentSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
});
