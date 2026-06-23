import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ToolCard } from "../../components/ToolCard";
import { SectionHeader } from "../../components/SectionHeader";
import { SECTIONS, ALL_TOOLS } from "../../constants/tools";
import { categoryColors } from "../../constants/colors";
import { useColors } from "../../lib/useColors";
import { CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP, SPACING } from "../../constants/layout";

interface ListItem {
  type: "header" | "section" | "tool";
  sectionId?: string;
  tool?: (typeof ALL_TOOLS)[number];
}

const listData: ListItem[] = [
  { type: "header" },
  ...SECTIONS.flatMap((section) => [
    { type: "section" as const, sectionId: section.id },
    ...section.tools.map((tool) => ({ type: "tool" as const, tool })),
  ]),
];

export default function HomeScreen() {
  const colors = useColors();

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <View
              style={[
                styles.headerContainer,
                { paddingTop: (insets?.top ?? 0) + HEADER_PADDING_TOP },
              ]}
            >
              <View style={styles.headerRow}>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    WhatsApp Toolkit
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                    15+ powerful tools
                  </Text>
                </View>
                <View style={styles.headerIconWrap}>
                  <Feather name="zap" size={22} color="#25D366" />
                </View>
              </View>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      );
    }

    if (item.type === "section") {
      const section = SECTIONS.find((s) => s.id === item.sectionId)!;
      return <SectionHeader label={section.label} color={section.id} icon={section.sectionIcon} />;
    }

    if (!item.tool) return null;
    const tool = item.tool;
    return (
      <ToolCard
        key={tool.id}
        title={tool.title}
        subtitle={tool.subtitle}
        icon={tool.icon}
        color={categoryColors[tool.category]}
        isAI={tool.isAI}
        onPress={() => router.push(tool.route as any)}
      />
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.type === "header"
            ? "header"
            : item.type === "section"
              ? `s-${item.sectionId}`
              : `t-${item.tool?.id}`
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  headerContainer: {
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(37, 211, 102, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
