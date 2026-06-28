import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import * as Haptics from "expo-haptics";
import { Header } from "../../components/Header";
import { router } from "expo-router";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useColors, useTheme, type ThemePreference } from "../../lib/useColors";
import { CONTENT_BOTTOM_PADDING, RADIUS, RADIUS_SM, SPACING } from "../../constants/layout";
import {
  getProvider,
  setProvider,
  getApiKey,
  setApiKey,
  getGeminiKey,
  setGeminiKey,
  getGroqKey,
  setGroqKey,
  testApiKey,
} from "../../lib/storage";
import type { AIProvider } from "../../lib/storage";

type ProviderConfig = {
  id: AIProvider;
  name: string;
  model: string;
  rateLimit: string;
  speed?: string;
  badge: "FREE" | "PAID";
  color: string;
  dotColor: string;
  getKey: () => Promise<string>;
  setKey: (key: string) => Promise<void>;
  keyPrefix: string;
  consoleUrl: string;
  consoleName: string;
  infoText?: string;
  howToSteps?: string[];
};

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "gemini-2.0-flash-lite",
    rateLimit: "30 req/min",
    badge: "FREE",
    color: "#4285F4",
    dotColor: "#4285F4",
    getKey: getGeminiKey,
    setKey: setGeminiKey,
    keyPrefix: "AIzaSy...",
    consoleUrl: "https://aistudio.google.com/apikey",
    consoleName: "Google AI Studio",
    infoText:
      "Google Gemini is completely free — no credit card required. Powered by Gemini 2.0 Flash Lite.",
    howToSteps: [
      "Go to aistudio.google.com",
      "Sign in with your Google account",
      "Click 'Get API Key' → 'Create API Key'",
      "Copy the key (starts with AIzaSy...)",
      "Paste above and tap Save",
    ],
  },
  {
    id: "groq",
    name: "Groq",
    model: "Llama 3.1 8B",
    rateLimit: "30 req/min",
    speed: "Ultra-fast",
    badge: "FREE",
    color: "#F55036",
    dotColor: "#F55036",
    getKey: getGroqKey,
    setKey: setGroqKey,
    keyPrefix: "gsk_....",
    consoleUrl: "https://console.groq.com/keys",
    consoleName: "Groq Console",
    infoText:
      "Groq is completely free — no credit card required. Powered by Llama 3.1 running on custom hardware (10× faster than OpenAI).",
    howToSteps: [
      "Go to console.groq.com",
      "Sign up (no credit card needed)",
      "Click 'API Keys' → 'Create API Key'",
      "Copy the key (starts with gsk_....)",
      "Paste above and tap Save",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    model: "GPT-3.5 Turbo",
    rateLimit: "Requires billing",
    badge: "PAID",
    color: "#10A37F",
    dotColor: "#10A37F",
    getKey: getApiKey,
    setKey: setApiKey,
    keyPrefix: "sk-....",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleName: "OpenAI Platform",
    infoText: "OpenAI requires a paid account with billing enabled. GPT-3.5 Turbo is affordable.",
    howToSteps: [
      "Go to platform.openai.com",
      "Sign in and set up billing",
      "Click 'API Keys' → 'Create new secret key'",
      "Copy the key (starts with sk-....)",
      "Paste above and tap Save",
    ],
  },
];

const GREEN = "#25D366";
const GREEN_DARK = "#128C7E";

export default function SettingsScreen() {
  const colors = useColors();
  const { themePreference, setThemePreference } = useTheme();
  const [provider, setProviderState] = useState<AIProvider>("gemini");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "success" | "error">>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const p = await getProvider();
      setProviderState(p);
      const k: Record<string, string> = {};
      const h: Record<string, boolean> = {};
      for (const prov of PROVIDERS) {
        const key = await prov.getKey();
        k[prov.id] = key;
        h[prov.id] = key.length > 0;
      }
      setKeys(k);
      setHasKey(h);
    })();
  }, []);

  const handleProviderSelect = async (id: AIProvider) => {
    await setProvider(id);
    setProviderState(id);
    setSaved(false);
    setTestResult((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    Haptics.selectionAsync();
  };

  const handleKeyChange = (id: string, value: string) => {
    setKeys((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const handleSaveKey = async () => {
    const prov = PROVIDERS.find((p) => p.id === provider);
    if (!prov) return;
    setSaving(true);
    await prov.setKey(keys[prov.id]?.trim() ?? "");
    setHasKey((prev) => ({ ...prev, [prov.id]: (keys[prov.id]?.trim() ?? "").length > 0 }));
    setSaving(false);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestKey = async (id: string) => {
    setTesting(id);
    setTestResult((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      await testApiKey(id as AIProvider);
      setTestResult((prev) => ({ ...prev, [id]: "success" }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: "error" }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTesting(null);
  };

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;
  const platformName = Platform.OS === "web" ? "Web" : Platform.OS === "ios" ? "iOS" : "Android";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ 
            paddingTop: (insets?.top ?? 0) + 16,
            backgroundColor: colors.background,
          }}>
            <Header title="Settings" />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
      >

      {/* ── Theme Section ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>THEME</Text>
        {(
          [
            { id: "system", name: "System Default", icon: "smartphone" },
            { id: "dark", name: "Dark Mode", icon: "moon" },
          ] as const
        ).map((opt) => {
          const isSelected = themePreference === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[
                styles.providerCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? GREEN : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={async () => {
                await setThemePreference(opt.id);
                Haptics.selectionAsync();
              }}
            >
              <View style={styles.providerRow}>
                {/* Radio Button */}
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected ? GREEN : colors.border,
                    },
                  ]}
                >
                  {isSelected ? (
                    <View style={[styles.radioInner, { backgroundColor: GREEN }]} />
                  ) : null}
                </View>

                {/* Theme Info */}
                <View style={styles.providerInfo}>
                  <View style={[styles.providerNameRow, { gap: 8 }]}>
                    <Feather
                      name={opt.icon}
                      size={16}
                      color={isSelected ? GREEN : colors.mutedForeground}
                    />
                    <Text style={[styles.providerName, { color: colors.foreground }]}>
                      {opt.name}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── AI Provider Section ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>AI PROVIDER</Text>
        {PROVIDERS.map((prov) => {
          const isSelected = provider === prov.id;
          const keyConfigured = hasKey[prov.id];
          return (
            <Pressable
              key={prov.id}
              style={[
                styles.providerCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? GREEN : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => handleProviderSelect(prov.id)}
            >
              <View style={styles.providerRow}>
                {/* Radio Button */}
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected ? GREEN : colors.border,
                    },
                  ]}
                >
                  {isSelected ? (
                    <View style={[styles.radioInner, { backgroundColor: GREEN }]} />
                  ) : null}
                </View>

                {/* Provider Info */}
                <View style={styles.providerInfo}>
                  <View style={styles.providerNameRow}>
                    <View style={[styles.providerDot, { backgroundColor: prov.dotColor }]} />
                    <Text style={[styles.providerName, { color: colors.foreground }]}>
                      {prov.name}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: prov.badge === "FREE" ? GREEN : "#FF9800",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{prov.badge}</Text>
                    </View>
                    {keyConfigured ? (
                      <View style={styles.checkIcon}>
                        <Feather name="check-circle" size={16} color={GREEN} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.providerDesc, { color: colors.mutedForeground }]}>
                    {prov.model} • {prov.rateLimit}
                    {prov.speed ? ` • ${prov.speed}` : ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── API Key Section (for selected provider) ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {selectedProvider.name.toUpperCase()} API KEY
        </Text>

        {/* Info Box */}
        {selectedProvider.infoText ? (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: `${GREEN}10`,
                borderColor: `${GREEN}40`,
              },
            ]}
          >
            <View style={styles.infoBoxIcon}>
              <Feather name="gift" size={18} color={GREEN_DARK} />
            </View>
            <Text style={[styles.infoBoxText, { color: GREEN_DARK }]}>
              {selectedProvider.infoText}
            </Text>
          </View>
        ) : null}

        {/* Key Input */}
        <View
          style={[
            styles.keyInputCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.keyInputRow}>
            <TextInput
              style={[
                styles.keyInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              secureTextEntry={!showKeys[selectedProvider.id]}
              placeholder={`Enter ${selectedProvider.name} API key...`}
              placeholderTextColor={colors.mutedForeground}
              value={keys[selectedProvider.id] ?? ""}
              onChangeText={(v) => handleKeyChange(selectedProvider.id, v.trim())}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={[styles.keyToggleBtn, { backgroundColor: colors.muted }]}
              onPress={() =>
                setShowKeys((prev) => ({
                  ...prev,
                  [selectedProvider.id]: !prev[selectedProvider.id],
                }))
              }
            >
              <Feather
                name={showKeys[selectedProvider.id] ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>

          {/* Save & Test Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[
                styles.saveBtn,
                {
                  backgroundColor: GREEN,
                  opacity: !keys[selectedProvider.id]?.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleSaveKey}
              disabled={!keys[selectedProvider.id]?.trim() || saving}
            >
              {saving ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Feather name={saved ? "check" : "save"} size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save"}</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.testBtn,
                {
                  backgroundColor: `${colors.mutedForeground}20`,
                  opacity: !keys[selectedProvider.id]?.trim() || testing !== null ? 0.5 : 1,
                },
              ]}
              onPress={() => handleTestKey(selectedProvider.id)}
              disabled={!keys[selectedProvider.id]?.trim() || testing !== null}
            >
              {testing === selectedProvider.id ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Feather
                    name={
                      testResult[selectedProvider.id] === "success"
                        ? "check-circle"
                        : testResult[selectedProvider.id] === "error"
                          ? "x-circle"
                          : "zap"
                    }
                    size={16}
                    color={
                      testResult[selectedProvider.id] === "success"
                        ? GREEN
                        : testResult[selectedProvider.id] === "error"
                          ? colors.destructive
                          : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.testBtnText,
                      {
                        color:
                          testResult[selectedProvider.id] === "success"
                            ? GREEN
                            : testResult[selectedProvider.id] === "error"
                              ? colors.destructive
                              : colors.mutedForeground,
                      },
                    ]}
                  >
                    {testResult[selectedProvider.id] === "success"
                      ? "Valid!"
                      : testResult[selectedProvider.id] === "error"
                        ? "Invalid"
                        : "Test Key"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Console Link */}
          <Pressable
            style={styles.consoleLinkRow}
            onPress={() => Linking.openURL(selectedProvider.consoleUrl)}
          >
            <Text style={[styles.consoleLink, { color: GREEN }]}>
              Get your {selectedProvider.name} API key →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── How to get a key ── */}
      {selectedProvider.howToSteps ? (
        <View style={styles.section}>
          <View
            style={[styles.howToCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.howToTitle, { color: colors.foreground }]}>
              How to get a {selectedProvider.name} key
            </Text>
            {selectedProvider.howToSteps.map((step, i) => (
              <Text key={i} style={[styles.howToStep, { color: colors.mutedForeground }]}>
                {i + 1}. {step}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── About Section ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View
          style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.aboutRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.foreground }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: GREEN }]}>1.0.0</Text>
          </View>
          <View style={[styles.aboutRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.foreground }]}>Platform</Text>
            <Text style={[styles.aboutValue, { color: GREEN }]}>{platformName}</Text>
          </View>
          <View style={[styles.aboutRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.foreground }]}>AI Provider</Text>
            <Text style={[styles.aboutValue, { color: GREEN }]}>{selectedProvider.name}</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/privacy-policy");
            }}
            style={({ pressed }) => [
              styles.aboutRow,
              {
                borderBottomWidth: 0,
                backgroundColor: pressed ? `${colors.primary}08` : "transparent",
              },
            ]}
          >
            <Text style={[styles.aboutLabel, { color: colors.foreground }]}>Privacy Policy</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* ── Disclaimer ── */}
      <View style={styles.disclaimerWrap}>
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          WhatsApp Toolkit AI is not affiliated with or endorsed by WhatsApp Inc.{"\n"}or Meta
          Platforms.
        </Text>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: SPACING.md,
  },

  /* ── Provider Card ── */
  providerCard: {
    borderRadius: RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  providerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  checkIcon: {
    marginLeft: 2,
  },
  providerDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    marginLeft: 16,
  },

  /* ── Info Box ── */
  infoBox: {
    flexDirection: "row",
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    alignItems: "flex-start",
  },
  infoBoxIcon: {
    marginTop: 1,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  /* ── Key Input Card ── */
  keyInputCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  keyInputRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  keyInput: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  keyToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS_SM,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Action Buttons ── */
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: RADIUS_SM,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: RADIUS_SM,
  },
  testBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* ── Console Link ── */
  consoleLinkRow: {
    alignItems: "center",
  },
  consoleLink: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* ── How-to Card ── */
  howToCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  howToTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: SPACING.xs,
  },
  howToStep: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    paddingLeft: 4,
  },

  /* ── About Card ── */
  aboutCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: "hidden",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  aboutValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  /* ── Disclaimer ── */
  disclaimerWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    alignItems: "center",
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    fontStyle: "italic",
  },
});
