import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Alert,
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
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/useColors";
import { chat } from "../lib/openai";
import { ApiKeyWarning } from "../components/ApiKeyWarning";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { addHistory } from "../lib/storage";
import { COUNTRIES } from "../constants/countries";
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";

const GREEN = "#25D366";

// ── Types ─────────────────────────────────────────────────────────

interface BulkContact {
  id: string;
  name: string;
  phone: string;
  countryDial: string;
  status: "pending" | "sent" | "skipped";
}

// ── Quick Templates ───────────────────────────────────────────────

const QUICK_TEMPLATES = [
  {
    id: "diwali",
    label: "🪔 Diwali",
    text: "Happy Diwali {name}! 🪔✨ May this festival of lights bring joy, prosperity, and happiness to you and your family. Wishing you a wonderful celebration! 🎆🙏",
  },
  {
    id: "newyear",
    label: "🎆 New Year",
    text: "Happy New Year {name}! 🎉🥳 Wishing you a year filled with success, good health, and happiness. Let's make this year amazing! 🚀✨",
  },
  {
    id: "eid",
    label: "🌙 Eid",
    text: "Eid Mubarak {name}! 🌙✨ May this blessed occasion bring peace, happiness, and prosperity to you and your family. 🤲🕌",
  },
  {
    id: "christmas",
    label: "🎄 Christmas",
    text: "Merry Christmas {name}! 🎄🎅 Wishing you a joyful holiday season filled with love, laughter, and wonderful memories! ❄️🎁",
  },
  {
    id: "birthday",
    label: "🎂 Birthday",
    text: "Happy Birthday {name}! 🎂🎉 Wishing you an amazing day filled with love, laughter, and all the happiness in the world! May all your dreams come true! 🥳🎈",
  },
  {
    id: "business",
    label: "💼 Business",
    text: "Hi {name}, hope you're doing well! We have an exciting update for you. Would love to discuss it at your convenience. Looking forward to connecting! 🤝",
  },
  {
    id: "event",
    label: "🎪 Event Invite",
    text: "Hi {name}! 🎉 You're invited to our special event! We'd love to have you there. Please confirm your attendance. Looking forward to seeing you! 📅✨",
  },
  {
    id: "thankyou",
    label: "🙏 Thank You",
    text: "Hi {name}, I just wanted to say thank you for everything! Your support and kindness truly mean the world. Grateful to have you! 🙏❤️",
  },
];

const DELAY_OPTIONS = [
  { id: "none", label: "None", ms: 0 },
  { id: "3s", label: "3s", ms: 3000 },
  { id: "5s", label: "5s", ms: 5000 },
  { id: "10s", label: "10s", ms: 10000 },
];

// ── Component ─────────────────────────────────────────────────────

export default function BulkMessageScreen() {
  const colors = useColors();

  // Contact management
  const [contacts, setContacts] = useState<BulkContact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );
  const [showCountries, setShowCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // Message
  const [message, setMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  // AI generation
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");

  // Sending
  const [isSending, setIsSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [delay, setDelay] = useState("3s");

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const sentCount = contacts.filter((c) => c.status === "sent").length;
  const skippedCount = contacts.filter((c) => c.status === "skipped").length;
  const pendingCount = contacts.filter((c) => c.status === "pending").length;

  // ── Contact Handlers ──

  const handleAddContact = useCallback(() => {
    if (!newPhone.trim()) return;
    const cleanPhone = newPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone) return;

    // Check duplicate
    const exists = contacts.some(
      (c) => c.phone === cleanPhone && c.countryDial === selectedCountry.dial,
    );
    if (exists) {
      Alert.alert("Duplicate", "This number is already in the list.");
      return;
    }

    const contact: BulkContact = {
      id: `${Date.now()}-${Math.random()}`,
      name: newName.trim() || "",
      phone: cleanPhone,
      countryDial: selectedCountry.dial,
      status: "pending",
    };
    setContacts((prev) => [...prev, contact]);
    setNewName("");
    setNewPhone("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newPhone, newName, selectedCountry, contacts]);

  const handleRemoveContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert("Clear All", "Remove all contacts from the list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setContacts([]);
          setIsSending(false);
          setCurrentIndex(0);
        },
      },
    ]);
  }, []);

  const handlePasteMultiple = useCallback(() => {
    if (!pasteText.trim()) return;

    const lines = pasteText
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const newContacts: BulkContact[] = [];
    for (const line of lines) {
      // Try to parse "Name - Number" or "Name: Number" or just "Number"
      const match = line.match(/^(.+?)[\s]*[-:]\s*(\+?\d[\d\s]+)$/);
      let name = "";
      let phone = "";

      if (match) {
        name = match[1].trim();
        phone = match[2].replace(/[^0-9]/g, "");
      } else {
        phone = line.replace(/[^0-9]/g, "");
      }

      if (phone.length >= 7) {
        const exists = contacts.some(
          (c) => c.phone === phone && c.countryDial === selectedCountry.dial,
        );
        const alreadyAdded = newContacts.some((c) => c.phone === phone);
        if (!exists && !alreadyAdded) {
          newContacts.push({
            id: `${Date.now()}-${Math.random()}-${phone}`,
            name,
            phone,
            countryDial: selectedCountry.dial,
            status: "pending",
          });
        }
      }
    }

    if (newContacts.length === 0) {
      Alert.alert("No Valid Numbers", "Could not find valid phone numbers in the pasted text.");
      return;
    }

    setContacts((prev) => [...prev, ...newContacts]);
    setPasteText("");
    setShowPasteModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Added", `${newContacts.length} contacts added successfully!`);
  }, [pasteText, contacts, selectedCountry]);

  // ── Message Handlers ──

  const handlePasteMessage = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setMessage(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleAiGenerate = useCallback(async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Generate a WhatsApp bulk message about: ${aiTopic.trim()}. 
Use {name} as a placeholder for the recipient's name. 
Keep it friendly, engaging, and under 100 words. 
Include relevant emojis. 
Output ONLY the message text, no quotes or labels.`;

      const response = await chat(prompt);
      setMessage(response);
      setShowAiModal(false);
      setAiTopic("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("API key not set") && !msg.includes("API key required")) {
        Alert.alert("Error", msg);
      }
    } finally {
      setAiLoading(false);
    }
  }, [aiTopic]);

  // ── Personalize message ──

  const personalizeMessage = useCallback(
    (contact: BulkContact) => {
      return message.replace(/\{name\}/gi, contact.name || "Friend");
    },
    [message],
  );

  // ── Sending Handlers ──

  const handleStartSending = useCallback(() => {
    if (contacts.length === 0) {
      Alert.alert("No Contacts", "Add at least one contact to start sending.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("No Message", "Please compose a message before sending.");
      return;
    }

    // Reset all statuses to pending
    setContacts((prev) => prev.map((c) => ({ ...c, status: "pending" as const })));
    setCurrentIndex(0);
    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [contacts, message]);

  const handleSendCurrent = useCallback(async () => {
    if (currentIndex >= contacts.length) return;

    const contact = contacts[currentIndex];
    const personalizedMsg = personalizeMessage(contact);
    const cleanCode = contact.countryDial.replace(/\D/g, "");
    const url = `https://wa.me/${cleanCode}${contact.phone}?text=${encodeURIComponent(personalizedMsg)}`;

    try {
      await Linking.openURL(url);
      // Mark as sent
      setContacts((prev) =>
        prev.map((c, i) => (i === currentIndex ? { ...c, status: "sent" as const } : c)),
      );
      // Move to next after delay
      const delayMs = DELAY_OPTIONS.find((d) => d.id === delay)?.ms || 0;
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= contacts.length) {
            setIsSending(false);
            addHistory("Bulk Message", `Sent to ${sentCount + 1} contacts`);
            Alert.alert("Complete! 🎉", `Messages sent to all contacts!`);
          }
          return next;
        });
      }, delayMs);
    } catch {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  }, [currentIndex, contacts, personalizeMessage, delay, sentCount]);

  const handleSkipCurrent = useCallback(() => {
    if (currentIndex >= contacts.length) return;

    setContacts((prev) =>
      prev.map((c, i) => (i === currentIndex ? { ...c, status: "skipped" as const } : c)),
    );
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= contacts.length) {
        setIsSending(false);
        addHistory("Bulk Message", `Sent to ${sentCount} contacts, skipped ${skippedCount + 1}`);
      }
      return next;
    });
  }, [currentIndex, contacts, sentCount, skippedCount]);

  const handleStopSending = useCallback(() => {
    setIsSending(false);
    addHistory(
      "Bulk Message",
      `Sent to ${sentCount} of ${contacts.length} contacts`,
    );
  }, [sentCount, contacts.length]);

  // ── Render ──

  const isSubmitDisabled = contacts.length === 0 || !message.trim();

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
                if (router.canGoBack()) router.back();
                else router.replace("/");
              }}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Bulk Message
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
        {/* ── Contacts Section ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                CONTACTS
              </Text>
              {contacts.length > 0 && (
                <Pressable onPress={handleClearAll} hitSlop={8}>
                  <Text style={[styles.clearText, { color: "#EF4444" }]}>Clear All</Text>
                </Pressable>
              )}
            </View>

            {/* Add contact inputs */}
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="Name (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />

            <View style={styles.phoneRow}>
              <Pressable
                style={[
                  styles.codeBtn,
                  { backgroundColor: colors.muted, borderColor: colors.inputBorder },
                ]}
                onPress={() => setShowCountries(true)}
              >
                <Text style={[styles.codeText, { color: colors.foreground }]}>
                  {selectedCountry.dial}
                </Text>
                <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
              </Pressable>
              <TextInput
                style={[
                  styles.phoneInput,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="Phone number"
                placeholderTextColor={colors.mutedForeground}
                value={newPhone}
                onChangeText={(t) => setNewPhone(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
              <Pressable
                style={[styles.addBtn, { backgroundColor: GREEN }]}
                onPress={handleAddContact}
              >
                <Feather name="plus" size={18} color="#FFF" />
              </Pressable>
            </View>

            {/* Paste multiple button */}
            <Pressable
              style={[styles.pasteMultipleBtn, { borderColor: colors.border }]}
              onPress={() => setShowPasteModal(true)}
            >
              <Feather name="clipboard" size={14} color={colors.primary} />
              <Text style={[styles.pasteMultipleText, { color: colors.primary }]}>
                Paste Multiple Numbers
              </Text>
            </Pressable>

            {/* Contact list */}
            {contacts.length > 0 && (
              <View style={[styles.contactList, { borderTopColor: colors.border }]}>
                {contacts.map((contact, index) => (
                  <View
                    key={contact.id}
                    style={[
                      styles.contactItem,
                      index < contacts.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.contactAvatar,
                        {
                          backgroundColor:
                            contact.status === "sent"
                              ? `${GREEN}20`
                              : contact.status === "skipped"
                                ? "#FEE2E220"
                                : `${colors.primary}15`,
                        },
                      ]}
                    >
                      {contact.status === "sent" ? (
                        <Feather name="check" size={14} color={GREEN} />
                      ) : contact.status === "skipped" ? (
                        <Feather name="skip-forward" size={14} color="#EF4444" />
                      ) : (
                        <Feather name="user" size={14} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.contactInfo}>
                      {contact.name ? (
                        <Text
                          style={[styles.contactName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {contact.name}
                        </Text>
                      ) : null}
                      <Text
                        style={[styles.contactPhone, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {contact.countryDial} {contact.phone}
                      </Text>
                    </View>
                    {!isSending && (
                      <Pressable
                        onPress={() => handleRemoveContact(contact.id)}
                        hitSlop={8}
                        style={styles.removeBtn}
                      >
                        <Feather name="x" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Contact count */}
            <Text style={[styles.contactCount, { color: colors.mutedForeground }]}>
              {contacts.length === 0
                ? "No contacts added yet"
                : `${contacts.length} contact${contacts.length > 1 ? "s" : ""} added`}
            </Text>
          </View>
        </View>

        {/* ── Message Section ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MESSAGE</Text>
              <View style={styles.msgActions}>
                <Pressable
                  onPress={() => setShowAiModal(true)}
                  style={styles.inlineBtn}
                  hitSlop={8}
                >
                  <Feather name="zap" size={14} color={GREEN} />
                  <Text style={[styles.inlineBtnText, { color: GREEN }]}>AI</Text>
                </Pressable>
                <Pressable onPress={handlePasteMessage} style={styles.inlineBtn} hitSlop={8}>
                  <Feather name="clipboard" size={14} color={colors.primary} />
                  <Text style={[styles.inlineBtnText, { color: colors.primary }]}>Paste</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              style={[
                styles.multilineInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="Type your message here... Use {name} to personalize"
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Personalization tag hint */}
            <View style={[styles.tagHint, { backgroundColor: `${GREEN}10` }]}>
              <Feather name="info" size={13} color={GREEN} />
              <Text style={[styles.tagHintText, { color: GREEN }]}>
                Use <Text style={styles.tagBold}>{"{name}"}</Text> to auto-insert each contact's
                name
              </Text>
            </View>

            {/* Templates button */}
            <Pressable
              style={[styles.templatesBtn, { borderColor: colors.border }]}
              onPress={() => setShowTemplates(true)}
            >
              <Feather name="file-text" size={14} color={colors.primary} />
              <Text style={[styles.templatesBtnText, { color: colors.primary }]}>
                Quick Templates
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Preview ── */}
        {message.trim() && contacts.length > 0 && (
          <View style={styles.sectionWrap}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                PREVIEW (for {contacts[0].name || "Contact 1"})
              </Text>
              <View style={[styles.previewBubble, { backgroundColor: "#DCF8C6" }]}>
                <Text style={styles.previewText}>{personalizeMessage(contacts[0])}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Delay Setting ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              DELAY BETWEEN MESSAGES
            </Text>
            <View style={styles.chipRow}>
              {DELAY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.chip,
                    delay === opt.id
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setDelay(opt.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      delay === opt.id ? styles.chipTextSelected : { color: colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ── API Key Warning ── */}
        <View style={styles.sectionWrap}>
          <ApiKeyWarning />
        </View>

        {/* ── Send / Progress ── */}
        {!isSending ? (
          <View style={styles.sectionWrap}>
            <Pressable
              style={[
                styles.generateBtn,
                {
                  backgroundColor: isSubmitDisabled ? colors.border : GREEN,
                },
                isSubmitDisabled && {
                  shadowOpacity: 0,
                  elevation: 0,
                },
              ]}
              onPress={handleStartSending}
              disabled={isSubmitDisabled}
            >
              <Feather
                name="send"
                size={18}
                color={isSubmitDisabled ? colors.mutedForeground : "#FFFFFF"}
              />
              <Text
                style={[
                  styles.generateBtnText,
                  isSubmitDisabled && { color: colors.mutedForeground },
                ]}
              >
                Start Sending ({contacts.length})
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sectionWrap}>
            <View
              style={[
                styles.progressCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                SENDING PROGRESS
              </Text>

              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: GREEN,
                      width: `${((sentCount + skippedCount) / contacts.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.foreground }]}>
                {sentCount + skippedCount} of {contacts.length} completed
                {sentCount > 0 && ` (${sentCount} sent`}
                {skippedCount > 0 && `, ${skippedCount} skipped`}
                {(sentCount > 0 || skippedCount > 0) && ")"}
              </Text>

              {/* Current contact */}
              {currentIndex < contacts.length && (
                <View style={[styles.currentContact, { borderColor: colors.border }]}>
                  <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>
                    CURRENT
                  </Text>
                  <Text style={[styles.currentName, { color: colors.foreground }]}>
                    {contacts[currentIndex].name || "Contact"}{" "}
                    <Text style={{ color: colors.mutedForeground }}>
                      ({contacts[currentIndex].countryDial} {contacts[currentIndex].phone})
                    </Text>
                  </Text>

                  <View style={styles.sendActions}>
                    <Pressable
                      style={[styles.sendBtn, { backgroundColor: GREEN }]}
                      onPress={handleSendCurrent}
                    >
                      <Feather name="send" size={16} color="#FFF" />
                      <Text style={styles.sendBtnText}>Send via WhatsApp</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.skipBtn, { backgroundColor: colors.muted }]}
                      onPress={handleSkipCurrent}
                    >
                      <Feather name="skip-forward" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.skipBtnText, { color: colors.mutedForeground }]}>
                        Skip
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Stop button */}
              <Pressable
                style={[styles.stopBtn, { borderColor: "#EF4444" }]}
                onPress={handleStopSending}
              >
                <Feather name="square" size={14} color="#EF4444" />
                <Text style={[styles.stopBtnText, { color: "#EF4444" }]}>Stop Sending</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Country Modal ── */}
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
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Select Country
                </Text>
                <Pressable
                  onPress={() => {
                    setShowCountries(false);
                    setCountrySearch("");
                  }}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <View style={styles.searchBarWrap}>
                <View
                  style={[
                    styles.searchBar,
                    { backgroundColor: colors.card, borderColor: colors.inputBorder },
                  ]}
                >
                  <Feather name="search" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search country..."
                    placeholderTextColor={colors.mutedForeground}
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                  />
                </View>
              </View>
              <ScrollView
                style={styles.modalScroll}
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
                      setCountrySearch("");
                    }}
                  >
                    <Text style={styles.countryFlag}>{c.flag}</Text>
                    <Text style={[styles.countryName, { color: colors.foreground }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.countryDial, { color: GREEN }]}>{c.dial}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      </Modal>

      {/* ── Paste Multiple Modal ── */}
      <Modal visible={showPasteModal} animationType="slide" transparent={false}>
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
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Paste Multiple Numbers
                </Text>
                <Pressable onPress={() => setShowPasteModal(false)} hitSlop={12}>
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <View style={styles.pasteModalBody}>
                <View style={[styles.tagHint, { backgroundColor: `${GREEN}10` }]}>
                  <Feather name="info" size={13} color={GREEN} />
                  <Text style={[styles.tagHintText, { color: GREEN }]}>
                    Paste numbers separated by commas, newlines, or semicolons.{"\n"}
                    Format: "Name - Number" or just numbers.
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.pasteArea,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  placeholder={`Rahul - 9876543210\nPriya - 8765432109\n7654321098`}
                  placeholderTextColor={colors.mutedForeground}
                  value={pasteText}
                  onChangeText={setPasteText}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
                <View style={styles.pasteModalActions}>
                  <Pressable
                    style={[styles.pasteActionBtn, { backgroundColor: colors.muted }]}
                    onPress={async () => {
                      const text = await Clipboard.getStringAsync();
                      if (text) setPasteText(text);
                    }}
                  >
                    <Feather name="clipboard" size={14} color={colors.primary} />
                    <Text style={[styles.pasteActionText, { color: colors.primary }]}>
                      Paste from Clipboard
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.pasteActionBtn, { backgroundColor: GREEN }]}
                    onPress={handlePasteMultiple}
                  >
                    <Feather name="plus" size={14} color="#FFF" />
                    <Text style={[styles.pasteActionText, { color: "#FFF" }]}>Add Contacts</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      </Modal>

      {/* ── Templates Modal ── */}
      <Modal visible={showTemplates} animationType="slide" transparent={false}>
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
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Quick Templates
                </Text>
                <Pressable onPress={() => setShowTemplates(false)} hitSlop={12}>
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
                showsVerticalScrollIndicator={false}
              >
                {QUICK_TEMPLATES.map((tpl) => (
                  <Pressable
                    key={tpl.id}
                    style={[
                      styles.templateCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setMessage(tpl.text);
                      setShowTemplates(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.templateTitle, { color: colors.foreground }]}>
                      {tpl.label}
                    </Text>
                    <Text
                      style={[styles.templatePreview, { color: colors.mutedForeground }]}
                      numberOfLines={3}
                    >
                      {tpl.text}
                    </Text>
                    <View style={styles.templateUseRow}>
                      <Feather name="arrow-right" size={14} color={GREEN} />
                      <Text style={[styles.templateUseText, { color: GREEN }]}>Use Template</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      </Modal>

      {/* ── AI Generate Modal ── */}
      <Modal visible={showAiModal} animationType="slide" transparent={false}>
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
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  AI Generate Message
                </Text>
                <Pressable onPress={() => setShowAiModal(false)} hitSlop={12}>
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <View style={styles.pasteModalBody}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  DESCRIBE YOUR MESSAGE
                </Text>
                <TextInput
                  style={[
                    styles.multilineInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.inputBorder,
                      marginTop: SPACING.sm,
                    },
                  ]}
                  placeholder="e.g. Diwali wishes for friends, shop opening announcement, wedding invitation..."
                  placeholderTextColor={colors.mutedForeground}
                  value={aiTopic}
                  onChangeText={setAiTopic}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Pressable
                  style={[
                    styles.generateBtn,
                    {
                      backgroundColor: aiLoading || !aiTopic.trim() ? colors.muted : GREEN,
                      marginTop: SPACING.md,
                    },
                  ]}
                  onPress={handleAiGenerate}
                  disabled={aiLoading || !aiTopic.trim()}
                >
                  {aiLoading ? (
                    <LoadingSpinner size="small" color="#FFF" />
                  ) : (
                    <>
                      <Feather name="zap" size={18} color="#FFF" />
                      <Text style={styles.generateBtnText}>Generate with AI</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  sectionWrap: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md },

  card: { borderRadius: RADIUS, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  textInput: {
    height: 44,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  phoneRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "center" },
  codeBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  codeText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS_SM,
    alignItems: "center",
    justifyContent: "center",
  },

  pasteMultipleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  pasteMultipleText: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium" },

  contactList: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SPACING.sm },
  contactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: SPACING.sm },
  contactAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "500", fontFamily: "Inter_500Medium" },
  contactPhone: { fontSize: 12, fontFamily: "Inter_400Regular" },
  removeBtn: { padding: 4 },
  contactCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },

  msgActions: { flexDirection: "row", gap: SPACING.md },
  inlineBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  inlineBtnText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  multilineInput: {
    minHeight: 100,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },

  tagHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS_SM,
  },
  tagHintText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  tagBold: { fontWeight: "700", fontFamily: "Inter_700Bold" },

  templatesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  templatesBtnText: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium" },

  previewBubble: {
    padding: SPACING.md,
    borderRadius: RADIUS,
    borderTopLeftRadius: 4,
  },
  previewText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a1a", lineHeight: 20 },

  chipRow: { flexDirection: "row", gap: SPACING.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium" },
  chipTextSelected: { color: "#FFFFFF" },

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
  generateBtnText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#FFF" },

  progressCard: { borderRadius: RADIUS, borderWidth: 1, padding: SPACING.md, gap: SPACING.md },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },

  currentContact: {
    borderWidth: 1,
    borderRadius: RADIUS_SM,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  currentLabel: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  currentName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  sendActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs },
  sendBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: RADIUS_SM,
  },
  sendBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: "#FFF" },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: RADIUS_SM,
  },
  skipBtnText: { fontSize: 14, fontWeight: "500", fontFamily: "Inter_500Medium" },

  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
  },
  stopBtnText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  /* Modals */
  modalScreen: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalScroll: { flex: 1 },

  searchBarWrap: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", height: "100%" },

  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryFlag: { fontSize: 20, marginRight: SPACING.sm },
  countryName: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  countryDial: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  pasteModalBody: { padding: SPACING.lg, gap: SPACING.md },
  pasteArea: {
    minHeight: 200,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  pasteModalActions: { flexDirection: "row", gap: SPACING.sm },
  pasteActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: RADIUS_SM,
  },
  pasteActionText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  templateCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  templateTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  templatePreview: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  templateUseRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  templateUseText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
