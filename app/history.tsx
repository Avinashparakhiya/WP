import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useColors } from "../lib/useColors";
import { router } from "expo-router";
import { CONTENT_BOTTOM_PADDING, RADIUS, RADIUS_SM, SPACING, HEADER_PADDING_TOP } from "../constants/layout";
import {
  getHistory,
  deleteHistoryItem,
  deleteHistoryItems,
  clearHistory,
  toggleFavoriteHistoryItem,
  type HistoryItem,
} from "../lib/storage";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

export default function HistoryScreen() {
  const colors = useColors();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadHistory = useCallback(async () => {
    const items = await getHistory();
    setHistory(items);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = history.filter(
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

  const handleToggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    await deleteHistoryItems([...selected]);
    setSelected(new Set());
    setSelectMode(false);
    await loadHistory();
    setConfirmDelete(false);
  };

  const handleClearAll = async () => {
    await clearHistory();
    setSelected(new Set());
    setSelectMode(false);
    await loadHistory();
    setConfirmClear(false);
  };

  const handleToggleFav = async (id: string) => {
    await toggleFavoriteHistoryItem(id);
    await loadHistory();
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
          if (selectMode) {
            toggleSelect(item.id);
          } else {
            Clipboard.setStringAsync(item.value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert("Copied", "History item copied to clipboard.");
          }
        }}
        style={[
          styles.item,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.itemRow}>
          {selectMode && (
            <View style={styles.checkboxContainer}>
              <Feather
                name={isSelected ? "check-square" : "square"}
                size={18}
                color={isSelected ? colors.primary : colors.mutedForeground}
              />
            </View>
          )}
          <View style={styles.itemBody}>
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
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>History</Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {history.length} items
              </Text>
            </View>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

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
            placeholder="Search history..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable
          style={[
            styles.iconBtn,
            { backgroundColor: selectMode ? `${colors.primary}20` : `${colors.mutedForeground}15` }
          ]}
          onPress={() => {
            setSelectMode(!selectMode);
            setSelected(new Set());
          }}
        >
          <Feather name="list" size={18} color={selectMode ? colors.primary : colors.mutedForeground} />
        </Pressable>
        {!selectMode && (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: `${colors.destructive}20` }]}
            onPress={() => setConfirmClear(true)}
            disabled={history.length === 0}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        )}
      </View>

      {/* Selection Action Bar */}
      {selectMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable style={styles.selectAllBtn} onPress={handleToggleSelectAll}>
            <Feather
              name={selected.size === filtered.length && filtered.length > 0 ? "check-square" : "square"}
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.selectionText, { color: colors.foreground }]}>
              {selected.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
            </Text>
          </Pressable>
          
          <View style={styles.selectionRight}>
            <Text style={[styles.selectedCount, { color: colors.mutedForeground }]}>
              {selected.size} selected
            </Text>
            <Pressable
              style={[styles.barDeleteBtn, { opacity: selected.size === 0 ? 0.5 : 1 }]}
              onPress={() => setConfirmDelete(true)}
              disabled={selected.size === 0}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
              <Text style={[styles.barDeleteText, { color: colors.destructive }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

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
            icon="clock"
            title="No history found"
            description={search ? "Try searching for something else" : "Your generated messages will appear here"}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Dialogs */}
      <ConfirmDialog
        visible={confirmClear}
        title="Clear all history?"
        message="This will permanently delete all items in your history. This action cannot be undone."
        confirmLabel="Clear All"
        confirmColor={colors.destructive}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete selected?"
        message="Are you sure you want to delete selected history? Once deleted, it cannot be undone."
        confirmLabel="Delete"
        confirmColor={colors.destructive}
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemBody: {
    flex: 1,
    gap: SPACING.xs,
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  selectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  selectedCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  barDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS_SM,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  barDeleteText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
