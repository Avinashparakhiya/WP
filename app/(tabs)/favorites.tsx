import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View, Modal, Linking, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Header } from "../../components/Header";
import { EmptyState } from "../../components/EmptyState";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useColors } from "../../lib/useColors";
import { useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { CONTENT_BOTTOM_PADDING, RADIUS, SPACING } from "../../constants/layout";
import {
  getHistory,
  deleteHistoryItem,
  deleteHistoryItems,
  toggleFavoriteHistoryItem,
  updateHistoryItemValue,
  type HistoryItem,
} from "../../lib/storage";

const GREEN = "#25D366";

export default function FavoritesScreen() {
  const colors = useColors();
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Detail Modal States
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
  const [editedValue, setEditedValue] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [whatsappPhone, setWhatsappPhone] = useState("");

  const loadFavorites = useCallback(async () => {
    const items = await getHistory();
    const favs = items.filter((item) => !!item.isFavorite);
    setFavorites(favs);
  }, []);

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const filtered = favorites.filter(
    (item) =>
      item.tool.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenDetail = (item: HistoryItem) => {
    setDetailItem(item);
    setEditedValue(item.value);
    setWhatsappPhone("");
  };

  const handleSaveChanges = async () => {
    if (!detailItem) return;
    try {
      await updateHistoryItemValue(detailItem.id, editedValue);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadFavorites();
      Alert.alert("Success", "Message changes saved successfully.");
    } catch (err) {
      Alert.alert("Error", "Could not save message changes.");
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(editedValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied", "Copied edited message to clipboard.");
  };

  const handleShare = async () => {
    try {
      await Sharing.shareAsync(editedValue, { dialogTitle: "Share message" });
    } catch {
      // User cancelled
    }
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappPhone.trim()) return;
    const cleanPhone = whatsappPhone.replace(/\D/g, "");
    const cleanCode = countryCode.replace(/\D/g, "");
    const fullPhone = `${cleanCode}${cleanPhone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(editedValue)}`;
    try {
      await Linking.openURL(url);
      setDetailItem(null);
    } catch (err) {
      Alert.alert("Error", "Could not launch WhatsApp.");
    }
  };

  const handleDeleteSelected = async () => {
    await deleteHistoryItems([...selected]);
    setSelected(new Set());
    setSelectMode(false);
    await loadFavorites();
    setConfirmDelete(false);
  };

  const handleToggleFav = async (id: string) => {
    await toggleFavoriteHistoryItem(id);
    await loadFavorites();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isSelected = selected.has(item.id);
    const isFav = !!item.isFavorite;

    return (
      <Pressable
        onLongPress={() => {
          setSelectMode(true);
          toggleSelect(item.id);
        }}
        onPress={() => {
          if (selectMode) toggleSelect(item.id);
          else handleOpenDetail(item);
        }}
        style={[
          styles.item,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTool, { color: colors.primary }]}>{item.tool}</Text>
          <View style={styles.itemActions}>
            <Pressable onPress={() => handleToggleFav(item.id)} hitSlop={8} style={styles.favBtn}>
              <Feather
                name="heart"
                size={14}
                color={isFav ? "#EF4444" : colors.mutedForeground}
                fill={isFav ? "#EF4444" : "transparent"}
              />
            </Pressable>
            <Text style={[styles.itemTime, { color: colors.mutedForeground }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <Text style={[styles.itemValue, { color: colors.foreground }]} numberOfLines={3}>
          {item.value}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title="Favorites" subtitle={`${favorites.length} items`} />

      {/* Search + Actions */}
      <View style={[styles.searchRow, { marginHorizontal: SPACING.lg }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.inputBorder },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search favorites..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {selectMode ? (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: `${colors.destructive}20` }]}
            onPress={() => setConfirmDelete(true)}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        ) : null}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.lg },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="heart"
            title="No favorites yet"
            subtitle={search ? "Try searching for something else" : "Tap the heart icon on any generated AI message to save it here"}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Dialogs */}
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete selected?"
        message={`Are you sure you want to delete the ${selected.size} selected items?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* ── Favorite Detail/Edit/Send Modal ── */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Use Favorite</Text>
                <Pressable onPress={() => setDetailItem(null)} hitSlop={12}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Edit Section */}
                <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>EDIT MESSAGE</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  value={editedValue}
                  onChangeText={setEditedValue}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* Edit Actions */}
                <View style={styles.modalActionsRow}>
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: `${colors.primary}15` }]}
                    onPress={handleSaveChanges}
                  >
                    <Feather name="save" size={14} color={colors.primary} />
                    <Text style={[styles.modalActionText, { color: colors.primary }]}>Save</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: `${colors.secondary}15` }]}
                    onPress={handleCopy}
                  >
                    <Feather name="copy" size={14} color={colors.secondary} />
                    <Text style={[styles.modalActionText, { color: colors.secondary }]}>Copy</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: "rgba(107, 114, 128, 0.15)" }]}
                    onPress={handleShare}
                  >
                    <Feather name="share-2" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.modalActionText, { color: colors.mutedForeground }]}>Share</Text>
                  </Pressable>
                </View>

                {/* WhatsApp Section */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>SEND DIRECT TO WHATSAPP</Text>
                <View style={styles.phoneInputRow}>
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
                    onChangeText={(text) => setCountryCode(text.replace(/[^0-9+]/g, ""))}
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
                    value={whatsappPhone}
                    onChangeText={(text) => setWhatsappPhone(text.replace(/[^0-9]/g, ""))}
                    placeholder="Enter phone number..."
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                  />
                </View>

                <Pressable
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: !whatsappPhone.trim() ? colors.muted : GREEN,
                      opacity: !whatsappPhone.trim() ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSendWhatsapp}
                  disabled={!whatsappPhone.trim()}
                >
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Send via WhatsApp</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    height: 44,
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  item: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTool: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  favBtn: {
    padding: 4,
  },
  itemTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  itemValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "85%",
  },
  modalContent: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  modalScroll: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  modalInput: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: RADIUS,
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: SPACING.xs,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  countryCodeInput: {
    width: 65,
    height: 44,
    borderRadius: RADIUS,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 46,
    borderRadius: RADIUS,
    marginTop: SPACING.xs,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
