import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Header } from "../components/Header";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP } from "../constants/layout";
import {
  getGroupLinks,
  addGroupLink,
  updateGroupLink,
  deleteGroupLink,
  type GroupLink,
} from "../lib/storage";

const GREEN = "#25D366";
const CATEGORIES = ["Work", "Family", "Friends", "Business", "Study"];

export default function GroupManagerScreen() {
  const colors = useColors();
  const [links, setLinks] = useState<GroupLink[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupLink | null>(null);

  const loadLinks = useCallback(async () => {
    const data = await getGroupLinks();
    setLinks(data);
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    await addGroupLink(newName.trim(), newUrl.trim(), newCategory);
    setNewName("");
    setNewUrl("");
    setNewCategory(CATEGORIES[0]);
    setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await loadLinks();
  };

  const handleToggleFav = async (link: GroupLink) => {
    await updateGroupLink(link.id, { isFavorite: !link.isFavorite });
    await loadLinks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteGroupLink(deleteTarget.id);
    setDeleteTarget(null);
    await loadLinks();
  };

  const filtered = links.filter((l) => {
    if (filterCategory && l.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return l.name.toLowerCase().includes(s) || l.url.toLowerCase().includes(s);
    }
    return true;
  });

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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Group Manager</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      {/* ── Search & Add Row ── */}
      <View style={styles.actionsRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.inputBorder },
          ]}
        >
          <Feather
            name="search"
            size={18}
            color={colors.mutedForeground}
            style={{ marginRight: 2 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search groups..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: GREEN }]}
          onPress={() => setShowAdd(true)}
        >
          <Feather name="plus" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* ── Category Filters horizontal row ── */}
      <View style={{ height: 48, marginBottom: SPACING.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <Pressable
            style={[
              styles.filterChip,
              !filterCategory
                ? { backgroundColor: GREEN, borderColor: GREEN }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setFilterCategory(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: !filterCategory ? "#FFFFFF" : colors.mutedForeground },
              ]}
            >
              All
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.filterChip,
                filterCategory === cat
                  ? { backgroundColor: GREEN, borderColor: GREEN }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: filterCategory === cat ? "#FFFFFF" : colors.mutedForeground,
                  },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Groups list ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl,
          paddingHorizontal: SPACING.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather
              name="users"
              size={64}
              color={colors.mutedForeground}
              style={{ opacity: 0.6, marginBottom: 8 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No groups yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap + to add a WhatsApp group link
            </Text>
          </View>
        ) : (
          filtered.map((link) => (
            <Pressable
              key={link.id}
              style={[
                styles.groupCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                const { Linking } = require("react-native");
                Linking.openURL(link.url);
              }}
            >
              <View style={styles.groupHeader}>
                <Feather name={link.isFavorite ? "star" : "users"} size={16} color={GREEN} />
                <Text style={[styles.groupName, { color: colors.foreground }]}>{link.name}</Text>
              </View>
              <Text style={[styles.groupUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
                {link.url}
              </Text>
              <View style={styles.groupFooter}>
                <Text style={[styles.groupCat, { color: colors.mutedForeground }]}>
                  {link.category}
                </Text>
                <View style={styles.groupActions}>
                  <Pressable
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFav(link);
                    }}
                  >
                    <Feather
                      name={link.isFavorite ? "star" : "star"}
                      size={16}
                      color={link.isFavorite ? "#F59E0B" : colors.mutedForeground}
                      fill={link.isFavorite ? "#F59E0B" : "transparent"}
                    />
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(link);
                    }}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
           <Header title="Add Group Link" />
          <View style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.foreground }]}>Group Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="e.g., Family Group"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>Invite Link</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="https://chat.whatsapp.com/..."
              placeholderTextColor={colors.mutedForeground}
              value={newUrl}
              onChangeText={setNewUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalCatRow}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: newCategory === cat ? `${colors.primary}20` : colors.muted,
                      borderColor: newCategory === cat ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { color: newCategory === cat ? colors.primary : colors.foreground },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={[
                styles.modalBtn,
                {
                  backgroundColor:
                    !newName.trim() || !newUrl.trim() ? colors.muted : colors.primary,
                },
              ]}
              onPress={handleAdd}
              disabled={!newName.trim() || !newUrl.trim()}
            >
              <Text style={styles.modalBtnText}>Add Group</Text>
            </Pressable>
            <Pressable style={[styles.modalCancelBtn]} onPress={() => setShowAdd(false)}>
              <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Group"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

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

  /* Search & Add */
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Category Row */
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* List */
  list: { flex: 1 },
  groupCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  groupName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  groupUrl: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  groupFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupCat: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupActions: {
    flexDirection: "row",
    gap: SPACING.md,
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
    gap: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.7,
  },

  /* Modal */
  modal: { flex: 1 },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  modalCatRow: { gap: SPACING.sm },
  catChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  modalBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  modalCancelBtn: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
