import React, { useState, useCallback, useEffect } from "react";
import {
  Alert,
  Image,
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
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
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
const QR_TYPES = [
  { id: "contact", label: "Contact" },
  { id: "group", label: "Group Link" },
  { id: "text", label: "Custom Text" },
  { id: "payment", label: "\u20B9 Payment" },
];

export default function QrGeneratorScreen() {
  const colors = useColors();
  const [qrType, setQrType] = useState("contact");

  // Inputs
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );
  const [showCountries, setShowCountries] = useState(false);
  const [search, setSearch] = useState("");

  const [groupLink, setGroupLink] = useState("");
  const [customText, setCustomText] = useState("");

  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentLink, setPaymentLink] = useState("");

  // Results
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset generated URL when type changes
  useEffect(() => {
    setGeneratedUrl("");
    setCopied(false);
  }, [qrType]);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleGenerate = useCallback(() => {
    let url = "";
    if (qrType === "contact") {
      if (!phone.trim()) return;
      const cleanPhone = phone.replace(/\D/g, "");
      url = `https://wa.me/${selectedCountry.dial.replace("+", "")}${cleanPhone}`;
    } else if (qrType === "group") {
      if (!groupLink.trim()) return;
      url = groupLink.trim();
    } else if (qrType === "text") {
      if (!customText.trim()) return;
      url = customText.trim();
    } else if (qrType === "payment") {
      if (paymentLink.trim()) {
        url = paymentLink.trim();
      } else if (upiId.trim()) {
        let upiUrl = `upi://pay?pa=${upiId.trim()}`;
        if (amount.trim()) upiUrl += `&am=${amount.trim()}`;
        if (note.trim()) upiUrl += `&tn=${encodeURIComponent(note.trim())}`;
        upiUrl += `&cu=INR`;
        url = upiUrl;
      } else {
        return; // No input
      }
    }

    setGeneratedUrl(url);
    setCopied(false);
  }, [qrType, phone, selectedCountry, groupLink, customText, upiId, amount, note, paymentLink]);

  const handleCopy = useCallback(async () => {
    if (!generatedUrl) return;
    await Clipboard.setStringAsync(generatedUrl);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addHistory("QR Generator", generatedUrl);
  }, [generatedUrl]);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setCustomText(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePasteUpi = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUpiId(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePastePaymentLink = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPaymentLink(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleShareQR = useCallback(async () => {
    if (!generatedUrl) return;

    if (Platform.OS === "web") {
      try {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`;
        
        if (navigator.share) {
          const response = await fetch(qrApiUrl);
          const blob = await response.blob();
          const file = new File([blob], "qr_code.png", { type: "image/png" });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "Share QR Code",
              text: "Here is my generated QR Code",
            });
            await addHistory("QR Code Shared", generatedUrl);
            return;
          }
        }
        
        // Fallback: Copy URL
        await Clipboard.setStringAsync(qrApiUrl);
        Alert.alert("Link Copied", "QR Code image link copied to clipboard. You can share it anywhere!");
        await addHistory("QR Code Shared (Copied Link)", generatedUrl);
      } catch (err) {
        console.error("Web share failed, falling back to copy:", err);
        try {
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`;
          await Clipboard.setStringAsync(qrApiUrl);
          Alert.alert("Link Copied", "QR Code image link copied to clipboard. You can share it anywhere!");
        } catch {
          Alert.alert("Error", "Could not share or copy QR code link.");
        }
      }
      return;
    }

    try {
      const filename = "qr_code.png";
      const localUri = `${FileSystem.cacheDirectory}${filename}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`;

      const downloadResult = await FileSystem.downloadAsync(qrApiUrl, localUri);
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "image/png",
          dialogTitle: "Share QR Code",
        });
        await addHistory("QR Code Shared", generatedUrl);
      } else {
        Alert.alert("Error", "Failed to download QR code image for sharing.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An error occurred while sharing the QR code.");
    }
  }, [generatedUrl]);

  const handleDownloadQR = useCallback(async () => {
    if (!generatedUrl) return;

    if (Platform.OS === "web") {
      try {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`;
        const response = await fetch(qrApiUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "qr_code.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        
        Alert.alert("Success", "QR Code downloaded successfully!");
        await addHistory("QR Code Saved", generatedUrl);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to download QR code.");
      }
      return;
    }

    try {
      let status = "denied";
      try {
        const res = await MediaLibrary.requestPermissionsAsync(true);
        status = res.status;
      } catch (e) {
        console.log("Failed to request media permissions in qr-generator:", e);
        Alert.alert(
          "Permission Error",
          "An error occurred while requesting media permissions. Please rebuild your app client."
        );
        return;
      }

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access the media library is required to save the QR code image.",
        );
        return;
      }

      const filename = "qr_code.png";
      const localUri = `${FileSystem.cacheDirectory}${filename}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`;

      const downloadResult = await FileSystem.downloadAsync(qrApiUrl, localUri);
      if (downloadResult.status === 200) {
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        Alert.alert("Success", "QR Code image saved to your photo gallery successfully!");
        await addHistory("QR Code Saved", generatedUrl);
      } else {
        Alert.alert("Error", "Failed to download QR code image.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An error occurred while saving the QR code.");
    }
  }, [generatedUrl]);

  const isSubmitDisabled = (() => {
    if (qrType === "contact") {
      return !phone.trim();
    }
    if (qrType === "group") {
      return !groupLink.trim();
    }
    if (qrType === "text") {
      return !customText.trim();
    }
    if (qrType === "payment") {
      return !paymentLink.trim() && !upiId.trim();
    }
    return true;
  })();

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
              QR Code Generator
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
        {/* ── QR Type Card ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>QR TYPE</Text>
            <View style={styles.chipRow}>
              {QR_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.chip,
                    qrType === type.id
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setQrType(type.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      qrType === type.id ? styles.chipTextSelected : { color: colors.foreground },
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ── Inputs Card (Conditional) ── */}
        {qrType === "contact" && (
          <View style={styles.sectionWrap}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
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
        )}

        {qrType === "group" && (
          <View style={styles.sectionWrap}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                GROUP LINK
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="https://chat.whatsapp.com/..."
                placeholderTextColor={colors.mutedForeground}
                value={groupLink}
                onChangeText={setGroupLink}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {qrType === "text" && (
          <View style={styles.sectionWrap}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                TEXT / URL
              </Text>
              <Pressable onPress={handlePaste} style={styles.pasteBtn} hitSlop={8}>
                <Feather name="clipboard" size={14} color={colors.primary} />
                <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
              </Pressable>
            </View>
              <TextInput
                style={[
                  styles.multilineInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="Enter text or URL..."
                placeholderTextColor={colors.mutedForeground}
                value={customText}
                onChangeText={setCustomText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {qrType === "payment" && (
          <View style={styles.sectionWrap}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Info banner */}
              <View style={[styles.infoBanner, { backgroundColor: `${GREEN}12` }]}>
                <Feather name="info" size={16} color={GREEN} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: GREEN }]}>
                  Enter a UPI ID to generate a UPI payment QR, or paste any payment link directly.
                </Text>
              </View>

              {/* UPI ID */}
              <View style={[styles.labelRow, { marginTop: SPACING.xs }]}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  UPI ID (OPTIONAL)
                </Text>
                <Pressable onPress={handlePasteUpi} style={styles.pasteBtn} hitSlop={8}>
                  <Feather name="clipboard" size={14} color={colors.primary} />
                  <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
                </Pressable>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="yourname@upi"
                placeholderTextColor={colors.mutedForeground}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Amount */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.mutedForeground, marginTop: SPACING.xs },
                ]}
              >
                AMOUNT &#8377; (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={(text) => {
                  // Allow only numbers and at most one decimal point
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  if (parts.length > 2) {
                    setAmount(parts[0] + "." + parts.slice(1).join(""));
                  } else {
                    setAmount(cleaned);
                  }
                }}
                keyboardType="decimal-pad"
              />

              {/* Note */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.mutedForeground, marginTop: SPACING.xs },
                ]}
              >
                NOTE (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="Payment for..."
                placeholderTextColor={colors.mutedForeground}
                value={note}
                onChangeText={setNote}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Direct Payment link */}
              <View style={styles.labelRow}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  PAYMENT LINK / URL (OPTIONAL)
                </Text>
                <Pressable onPress={handlePastePaymentLink} style={styles.pasteBtn} hitSlop={8}>
                  <Feather name="clipboard" size={14} color={colors.primary} />
                  <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
                </Pressable>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="https://razorpay.me/... or upi://pay?..."
                placeholderTextColor={colors.mutedForeground}
                value={paymentLink}
                onChangeText={setPaymentLink}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* ── Generate Action Button ── */}
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
            onPress={handleGenerate}
            disabled={isSubmitDisabled}
          >
            <Feather
              name={qrType === "payment" ? "credit-card" : "grid"}
              size={18}
              color={isSubmitDisabled ? colors.mutedForeground : "#FFFFFF"}
            />
            <Text
              style={[
                styles.generateBtnText,
                isSubmitDisabled && { color: colors.mutedForeground },
              ]}
            >
              {qrType === "payment" ? "Generate Payment QR" : "Generate QR Code"}
            </Text>
          </Pressable>
        </View>

        {/* ── Result Card ── */}
        {generatedUrl ? (
          <View style={styles.sectionWrap}>
            <View
              style={[
                styles.resultCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                GENERATED QR CODE
              </Text>

              {/* Live QR Image */}
              <View style={styles.qrImageContainer}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      generatedUrl,
                    )}`,
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={[styles.resultValue, { color: colors.primary }]}
                selectable
                numberOfLines={2}
              >
                {generatedUrl}
              </Text>

              <View style={styles.resultActions}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: copied ? `${colors.primary}20` : `${colors.primary}12`,
                    },
                  ]}
                  onPress={handleCopy}
                >
                  <Feather name={copied ? "check" : "copy"} size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Copy Link</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: `${colors.primary}12`,
                    },
                  ]}
                  onPress={handleShareQR}
                >
                  <Feather name="share-2" size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share QR</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: `${colors.primary}12`,
                    },
                  ]}
                  onPress={handleDownloadQR}
                >
                  <Feather name="download" size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Save QR</Text>
                </Pressable>
              </View>
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

  /* Chips */
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  chipTextSelected: {
    color: "#FFFFFF",
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

  /* Text Inputs */
  textInput: {
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  multilineInput: {
    minHeight: 100,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: "row",
    borderRadius: RADIUS_SM,
    padding: SPACING.md,
    alignItems: "flex-start",
    marginBottom: SPACING.xs,
  },
  infoIcon: {
    marginTop: 1,
    marginRight: SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Inter_500Medium",
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginHorizontal: SPACING.md,
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
    gap: SPACING.md,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
  },
  resultValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 18,
  },
  qrImageContainer: {
    width: 200,
    height: 200,
    borderRadius: RADIUS_SM,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9EDEF",
    padding: SPACING.md,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  resultActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: SPACING.xs,
    width: "100%",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 12,
    borderRadius: RADIUS_SM,
    minWidth: 90,
  },
  actionBtnText: {
    fontSize: 12,
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
