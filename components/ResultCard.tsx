import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useColors } from "../lib/useColors";
import { RADIUS, RADIUS_SM, SPACING } from "../constants/layout";

interface ResultCardProps {
  result: string;
  onCopy?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (text: string) => void;
}

export function ResultCard({ result, onCopy, isFavorite, onToggleFavorite }: ResultCardProps) {
  const colors = useColors();
  const [editedText, setEditedText] = useState(result);
  const [showSendRow, setShowSendRow] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setEditedText(result);
  }, [result]);

  const handleCopy = useCallback(() => {
    Clipboard.setStringAsync(editedText);
    onCopy?.();
  }, [editedText, onCopy]);

  const handleShare = useCallback(async () => {
    try {
      await Sharing.shareAsync(editedText, { dialogTitle: "Share message" });
    } catch {
      // User cancelled or share not available
    }
  }, [editedText]);

  const handleSendWhatsapp = async () => {
    if (!phone.trim()) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCode = countryCode.replace(/\D/g, "");
    const fullPhone = `${cleanCode}${cleanPhone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(editedText)}`;
    try {
      await Linking.openURL(url);
      setShowSendRow(false);
    } catch {
      Alert.alert("Error", "Could not launch WhatsApp.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[styles.resultInput, { color: colors.foreground }]}
          value={editedText}
          onChangeText={setEditedText}
          multiline
          textAlignVertical="top"
          scrollEnabled={false} // Let parent ScrollView handle scrolling
        />
      </ScrollView>
      <View style={[styles.actions, { borderColor: colors.border }]}>
        <Pressable
          style={[styles.button, { backgroundColor: `${colors.primary}20` }]}
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy"
        >
          <Feather name="copy" size={16} color={colors.primary} />
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: `${colors.secondary}20` }]}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Feather name="share-2" size={16} color={colors.secondary} />
        </Pressable>
        {onToggleFavorite ? (
          <Pressable
            style={[
              styles.button,
              { backgroundColor: isFavorite ? "#FEE2E2" : `${colors.mutedForeground}20` },
            ]}
            onPress={() => onToggleFavorite(editedText)}
            accessibilityRole="button"
            accessibilityLabel="Favorite"
          >
            <Feather
              name="heart"
              size={16}
              color={isFavorite ? "#EF4444" : colors.mutedForeground}
              fill={isFavorite ? "#EF4444" : "transparent"}
            />
          </Pressable>
        ) : null}
        <Pressable
          style={[
            styles.button,
            { backgroundColor: showSendRow ? "#E2F0D9" : `${colors.mutedForeground}20` },
          ]}
          onPress={() => setShowSendRow(!showSendRow)}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Feather name="send" size={16} color={showSendRow ? "#25D366" : colors.mutedForeground} />
        </Pressable>
      </View>

      {showSendRow ? (
        <View style={[styles.sendRow, { borderTopWidth: 1, borderColor: colors.border }]}>
          <TextInput
            style={[
              styles.countryCodeInput,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            value={countryCode}
            onChangeText={(t) => setCountryCode(t.replace(/[^0-9+]/g, ""))}
            placeholder="+91"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[
              styles.phoneInput,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ""))}
            placeholder="Enter phone number..."
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
          />
          <Pressable
            style={[
              styles.sendIconBtn,
              {
                backgroundColor: !phone.trim() ? colors.muted : "#25D366",
              },
            ]}
            onPress={handleSendWhatsapp}
            disabled={!phone.trim()}
          >
            <Feather name="send" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: "hidden",
  },
  scrollArea: {
    maxHeight: 200,
    padding: SPACING.md,
  },
  resultInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    minHeight: 80,
    padding: 0,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: RADIUS_SM,
  },
  sendRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    alignItems: "center",
  },
  countryCodeInput: {
    width: 60,
    height: 38,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  phoneInput: {
    flex: 1,
    height: 38,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sendIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS_SM,
    alignItems: "center",
    justifyContent: "center",
  },
});
