import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "../lib/useColors";
import { CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP, RADIUS, SPACING } from "../constants/layout";

export default function PrivacyPolicyScreen() {
  const colors = useColors();

  const sections = [
    {
      icon: "database",
      title: "Data Retention & Storage",
      desc: "All of your tool history, templates, and configurations are stored locally on your device. We do not run any cloud servers, databases, or tracking systems that collect your content.",
      points: [
        "Local Database: Stored securely using AsyncStorage on your device.",
        "Zero Server Logs: Your chat details, generated QR codes, and texts never leave your device unless you manually share them.",
      ],
    },
    {
      icon: "mic",
      title: "Microphone Permission",
      desc: "Required for the 'Voice to Message' conversion feature.",
      points: [
        "On-Demand Access: Microphone is only active when you tap the record button.",
        "Private Transcription: Audio data is captured locally and sent directly to the AI service for transcription. We do not save or record your audio files.",
      ],
    },
    {
      icon: "hard-drive",
      title: "Local Storage & File Permissions",
      desc: "Required to save outputs, export tools, and cache configurations.",
      points: [
        "File System: Access is used to export generated texts and save QR codes directly to your device storage.",
        "API Keys Storage: Your AI credentials (Google Gemini, Groq keys) are stored securely on your device and are never shared.",
      ],
    },
    {
      icon: "cpu",
      title: "Third-Party AI Services",
      desc: "Our AI assistant features operate via direct, client-to-server connections with artificial intelligence providers.",
      points: [
        "Direct Connection: Requests go directly from your device to the AI endpoints (e.g. Google Gemini, Groq).",
        "API Key Control: Since you use your own API keys, your usage is protected by your agreements with the provider without third-party tracking.",
      ],
    },
    {
      icon: "link",
      title: "WhatsApp Links & Direct Chat",
      desc: "Direct Chat and Link Generator use official, standard protocols.",
      points: [
        "Official Links: We use official wa.me and api.whatsapp.com URL schemes.",
        "No Interception: Your messages are routed directly to the WhatsApp application.",
      ],
    },
  ];

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
                backgroundColor: colors.background,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/settings");
                }
              }}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.lg,
        }}
      >
        {/* Core Shield Banner */}
        <View style={[styles.bannerCard, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
          <View style={[styles.bannerIconWrap, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="shield" size={28} color={colors.primary} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Your Privacy First</Text>
            <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
              WhatsApp Toolkit AI is built with privacy by design. We have no backend databases and never collect or view your personal information.
            </Text>
          </View>
        </View>

        {/* Section Cards */}
        {sections.map((section, idx) => (
          <View key={idx} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${colors.primary}10` }]}>
                <Feather name={section.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>{section.desc}</Text>
            <View style={styles.pointsList}>
              {section.points.map((pt, pIdx) => (
                <View key={pIdx} style={styles.pointRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.pointText, { color: colors.foreground }]}>{pt}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Last updated: June 2026. This policy describes all current features of WhatsApp Toolkit AI.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    flex: 1,
  },
  bannerCard: {
    flexDirection: "row",
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    alignItems: "center",
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerInfo: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  bannerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  pointsList: {
    gap: SPACING.sm,
    paddingLeft: 4,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: SPACING.lg,
    fontStyle: "italic",
  },
});
