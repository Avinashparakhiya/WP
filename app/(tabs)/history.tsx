import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Header } from "../../components/Header";
import { EmptyState } from "../../components/EmptyState";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useColors } from "../../lib/useColors";
import { CONTENT_BOTTOM_PADDING, RADIUS, SPACING } from "../../constants/layout";
import {
  getHistory,
  deleteHistoryItem,
  deleteHistoryItems,
  clearHistory,
  type HistoryItem,
} from "../../lib/storage";

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

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <Pressable
      onLongPress={() => {
        setSelectMode(true);
        toggleSelect(item.id);
      }}
      onPress={() => {
        if (selectMode) toggleSelect(item.id);
      }}
      style={[
        styles.item,
        {
          backgroundColor: colors.card,
          borderColor: selected.has(item.id) ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTool, { color: colors.primary }]}>{item.tool}</Text>
        <Text style={[styles.itemTime, { color: colors.mutedForeground }]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.itemValue, { color: colors.foreground }]} numberOfLines={3}>
        {item.value}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="History" subtitle={`${history.length} items`} />
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
        {selectMode ? (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: `${colors.destructive}20` }]}
            onPress={() => setConfirmDelete(true)}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: `${colors.destructive}20` }]}
            onPress={() => setConfirmClear(true)}
          >
            <Feather name="trash" size={18} color={colors.destructive} />
          </Pressable>
        )}
      </View>

      {/* Selection bar */}
      {selectMode ? (
        <View style={[styles.selectBar, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.selectText, { color: colors.primary }]}>
            {selected.size} selected
          </Text>
          <Pressable
            style={styles.selectCancelBtn}
            onPress={() => {
              setSelectMode(false);
              setSelected(new Set());
            }}
          >
            <Text style={[styles.selectCancelText, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.lg,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="clock"
            title="No history yet"
            subtitle="Your tool usage will appear here"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <ConfirmDialog
        visible={confirmClear}
        title="Clear All History"
        message="This will permanently delete all history items. This action cannot be undone."
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete ${selected.size} Item${selected.size > 1 ? "s" : ""}`}
        message="Delete selected history items?"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    marginTop: -4,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 40,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS,
  },
  selectText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  selectCancelBtn: { padding: 4 },
  selectCancelText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  item: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTool: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  itemTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  itemValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
