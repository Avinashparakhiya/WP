import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
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
import { EmptyState } from "../components/EmptyState";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { COUNTRIES } from "../constants/countries";
import { getRecentContacts, addRecentContact, deleteRecentContact } from "../lib/storage";

export default function DirectChatScreen() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
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
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="Direct Chat" subtitle="Chat without saving contact" />
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
          {/* Country code selector */}
          <Pressable
            style={[
              styles.countryBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.inputBorder,
              },
            ]}
            onPress={() => setShowCountries(!showCountries)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={[styles.countryDial, { color: colors.foreground }]}>
              {selectedCountry.dial}
            </Text>
            <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
          </Pressable>

          {showCountries ? (
            <View style={styles.countryDropdown}>
              <TextInput
                style={[
                  styles.searchInput,
                  { color: colors.foreground, backgroundColor: colors.muted },
                ]}
                placeholder="Search countries..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              <ScrollView
                style={styles.countryList}
                nestedScrollEnabled
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
                    <Text style={[styles.countryDialSmall, { color: colors.mutedForeground }]}>
                      {c.dial}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Phone number */}
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
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: !phone.trim() ? colors.muted : colors.primary,
              },
            ]}
            onPress={handleOpenChat}
            disabled={!phone.trim()}
          >
            <Feather name="message-circle" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Open WhatsApp Chat</Text>
          </Pressable>
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
                  <Feather name="user" size={16} color={colors.primary} />
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
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  countryDropdown: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 300,
    gap: 0,
  },
  searchInput: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderBottomWidth: 1,
  },
  countryList: {},
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  countryDialSmall: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  phoneInput: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    height: 48,
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
  recentSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: SPACING.md,
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
});
