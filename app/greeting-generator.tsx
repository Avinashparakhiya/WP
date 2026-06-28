import React, { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";

// ── Data ──────────────────────────────────────────────────────────

const OCCASIONS = [
  { id: "birthday", label: "🎂 Birthday" },
  { id: "anniversary", label: "💍 Anniversary" },
  { id: "wedding", label: "💒 Wedding" },
  { id: "newyear", label: "🎆 New Year" },
  { id: "diwali", label: "🪔 Diwali" },
  { id: "holi", label: "🎨 Holi" },
  { id: "eid", label: "🌙 Eid" },
  { id: "christmas", label: "🎄 Christmas" },
  { id: "raksha", label: "🧵 Raksha Bandhan" },
  { id: "navratri", label: "🪘 Navratri" },
  { id: "ganesh", label: "🐘 Ganesh Chaturthi" },
  { id: "pongal", label: "🌾 Pongal" },
  { id: "onam", label: "🛶 Onam" },
  { id: "baisakhi", label: "🌾 Baisakhi" },
  { id: "valentine", label: "❤️ Valentine's Day" },
  { id: "mother", label: "👩 Mother's Day" },
  { id: "father", label: "👨 Father's Day" },
  { id: "teacher", label: "📚 Teacher's Day" },
  { id: "friendship", label: "🤝 Friendship Day" },
  { id: "congratulations", label: "🎉 Congratulations" },
  { id: "thankyou", label: "🙏 Thank You" },
  { id: "getwell", label: "💐 Get Well Soon" },
  { id: "farewell", label: "👋 Farewell" },
  { id: "baby", label: "👶 Baby Shower" },
  { id: "independence", label: "🇮🇳 Independence Day" },
  { id: "republic", label: "🏛️ Republic Day" },
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Hinglish",
  "Gujarati",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Urdu",
  "Punjabi",
  "Kannada",
  "Malayalam",
  "Spanish",
  "French",
  "Arabic",
];

const CARD_THEMES = [
  {
    id: "royal_gold",
    label: "👑 Royal Gold",
    bg1: "#1a0a2e",
    bg2: "#16213e",
    accent: "#f5c518",
    textColor: "#ffffff",
    borderColor: "#f5c518",
    decoColor: "#f5c51880",
  },
  {
    id: "rose_garden",
    label: "🌹 Rose Garden",
    bg1: "#4a0e2e",
    bg2: "#2d0519",
    accent: "#ff6b9d",
    textColor: "#fff0f5",
    borderColor: "#ff6b9d",
    decoColor: "#ff6b9d60",
  },
  {
    id: "emerald",
    label: "💚 Emerald",
    bg1: "#0d3b2e",
    bg2: "#0a2f23",
    accent: "#25D366",
    textColor: "#e0fff0",
    borderColor: "#25D366",
    decoColor: "#25D36660",
  },
  {
    id: "ocean_blue",
    label: "🌊 Ocean Blue",
    bg1: "#0c1445",
    bg2: "#0a0e2a",
    accent: "#4fc3f7",
    textColor: "#e3f2fd",
    borderColor: "#4fc3f7",
    decoColor: "#4fc3f760",
  },
  {
    id: "sunset",
    label: "🌅 Sunset",
    bg1: "#4a1942",
    bg2: "#2d1b69",
    accent: "#ff8a65",
    textColor: "#fff3e0",
    borderColor: "#ff8a65",
    decoColor: "#ff8a6560",
  },
  {
    id: "lavender",
    label: "💜 Lavender",
    bg1: "#2d1f4e",
    bg2: "#1a1040",
    accent: "#ce93d8",
    textColor: "#f3e5f5",
    borderColor: "#ce93d8",
    decoColor: "#ce93d860",
  },
  {
    id: "white_minimal",
    label: "⬜ White Minimal",
    bg1: "#ffffff",
    bg2: "#f5f5f5",
    accent: "#333333",
    textColor: "#1a1a1a",
    borderColor: "#e0e0e0",
    decoColor: "#33333320",
  },
  {
    id: "festival",
    label: "🎊 Festival",
    bg1: "#b71c1c",
    bg2: "#880e0e",
    accent: "#ffd54f",
    textColor: "#ffffff",
    borderColor: "#ffd54f",
    decoColor: "#ffd54f80",
  },
  {
    id: "midnight",
    label: "🌙 Midnight",
    bg1: "#0d0d2b",
    bg2: "#000014",
    accent: "#b0bec5",
    textColor: "#eceff1",
    borderColor: "#78909c",
    decoColor: "#b0bec560",
  },
  {
    id: "cherry_blossom",
    label: "🌸 Cherry Blossom",
    bg1: "#3e1929",
    bg2: "#2a0f1e",
    accent: "#f48fb1",
    textColor: "#fce4ec",
    borderColor: "#f48fb1",
    decoColor: "#f48fb160",
  },
  {
    id: "saffron",
    label: "🧡 Saffron",
    bg1: "#e65100",
    bg2: "#bf360c",
    accent: "#fff176",
    textColor: "#ffffff",
    borderColor: "#fff176",
    decoColor: "#fff17680",
  },
  {
    id: "teal",
    label: "🩵 Teal",
    bg1: "#004d40",
    bg2: "#00332b",
    accent: "#80cbc4",
    textColor: "#e0f2f1",
    borderColor: "#80cbc4",
    decoColor: "#80cbc460",
  },
  {
    id: "dark_elegance",
    label: "🖤 Dark Elegance",
    bg1: "#1a1a1a",
    bg2: "#0d0d0d",
    accent: "#e0e0e0",
    textColor: "#fafafa",
    borderColor: "#616161",
    decoColor: "#e0e0e040",
  },
  {
    id: "peacock",
    label: "🦚 Peacock",
    bg1: "#1a237e",
    bg2: "#0d1142",
    accent: "#00e5ff",
    textColor: "#e0f7fa",
    borderColor: "#00e5ff",
    decoColor: "#00e5ff50",
  },
  {
    id: "copper",
    label: "🪙 Copper",
    bg1: "#3e2723",
    bg2: "#1b0f0a",
    accent: "#d4a373",
    textColor: "#efebe9",
    borderColor: "#d4a373",
    decoColor: "#d4a37360",
  },
  {
    id: "candy",
    label: "🍬 Candy",
    bg1: "#880e4f",
    bg2: "#4a0028",
    accent: "#ff80ab",
    textColor: "#fce4ec",
    borderColor: "#ff80ab",
    decoColor: "#ff80ab60",
  },
  {
    id: "forest",
    label: "🌲 Forest",
    bg1: "#1b3a1b",
    bg2: "#0e260e",
    accent: "#a5d6a7",
    textColor: "#e8f5e9",
    borderColor: "#a5d6a7",
    decoColor: "#a5d6a760",
  },
  {
    id: "cream",
    label: "🍦 Cream",
    bg1: "#fdf5e6",
    bg2: "#f5e6cc",
    accent: "#8d6e63",
    textColor: "#3e2723",
    borderColor: "#bcaaa4",
    decoColor: "#8d6e6330",
  },
  {
    id: "neon",
    label: "💫 Neon",
    bg1: "#12005e",
    bg2: "#0a0035",
    accent: "#e040fb",
    textColor: "#f3e5f5",
    borderColor: "#e040fb",
    decoColor: "#e040fb50",
  },
  {
    id: "tricolor",
    label: "🇮🇳 Tricolor",
    bg1: "#1a3a1a",
    bg2: "#0e260e",
    accent: "#ff9933",
    textColor: "#ffffff",
    borderColor: "#138808",
    decoColor: "#ff993360",
  },
];

const CARD_STYLES = [
  { id: "heartfelt", label: "💖 Heartfelt" },
  { id: "funny", label: "😂 Funny" },
  { id: "formal", label: "📋 Formal" },
  { id: "poetic", label: "✨ Poetic / Shayari" },
  { id: "religious", label: "🙏 Religious" },
  { id: "cute", label: "🥰 Cute" },
  { id: "inspirational", label: "🌟 Inspirational" },
];

const GREEN = "#25D366";

// ── Canvas Drawing ────────────────────────────────────────────────

function drawCardOnCanvas(
  canvas: HTMLCanvasElement,
  theme: (typeof CARD_THEMES)[number],
  greetingText: string,
  occasionLabel: string,
) {
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, theme.bg1);
  grad.addColorStop(1, theme.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative corner circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(0, 0, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W, H, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W, 0, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, H, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Outer decorative border
  const borderPad = 40;
  ctx.strokeStyle = theme.decoColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]);
  ctx.strokeRect(borderPad, borderPad, W - borderPad * 2, H - borderPad * 2);
  ctx.setLineDash([]);

  // Inner border
  const innerPad = 60;
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(innerPad, innerPad, W - innerPad * 2, H - innerPad * 2);

  // Corner decorations (small diamonds)
  const drawDiamond = (cx: number, cy: number, size: number) => {
    ctx.fillStyle = theme.accent;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  };
  drawDiamond(innerPad, innerPad, 14);
  drawDiamond(W - innerPad, innerPad, 14);
  drawDiamond(innerPad, H - innerPad, 14);
  drawDiamond(W - innerPad, H - innerPad, 14);

  // Decorative line at top
  const lineY = 160;
  const lineGrad = ctx.createLinearGradient(120, lineY, W - 120, lineY);
  lineGrad.addColorStop(0, "transparent");
  lineGrad.addColorStop(0.2, theme.accent);
  lineGrad.addColorStop(0.5, theme.accent);
  lineGrad.addColorStop(0.8, theme.accent);
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, lineY);
  ctx.lineTo(W - 120, lineY);
  ctx.stroke();

  // Small diamond in the center of top line
  drawDiamond(W / 2, lineY, 10);

  // Occasion title at top
  ctx.fillStyle = theme.accent;
  ctx.font = `bold 36px "Segoe UI", "Noto Sans", "Arial", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(occasionLabel.toUpperCase(), W / 2, 120);

  // Main greeting text - word wrap
  const maxWidth = W - 200;
  const lineHeight = 48;
  ctx.fillStyle = theme.textColor;
  ctx.font = `32px "Segoe UI", "Noto Sans Devanagari", "Noto Sans", "Arial", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines: string[] = [];
  const paragraphs = greetingText.split("\n");
  for (const para of paragraphs) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  // Center the text block vertically
  const totalTextHeight = lines.length * lineHeight;
  const startY = (H / 2) - (totalTextHeight / 2) + 40;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, startY + i * lineHeight);
  }

  // Decorative line at bottom
  const bottomLineY = H - 160;
  const bottomGrad = ctx.createLinearGradient(120, bottomLineY, W - 120, bottomLineY);
  bottomGrad.addColorStop(0, "transparent");
  bottomGrad.addColorStop(0.2, theme.accent);
  bottomGrad.addColorStop(0.5, theme.accent);
  bottomGrad.addColorStop(0.8, theme.accent);
  bottomGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = bottomGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, bottomLineY);
  ctx.lineTo(W - 120, bottomLineY);
  ctx.stroke();
  drawDiamond(W / 2, bottomLineY, 10);

  // Small watermark
  ctx.fillStyle = theme.decoColor;
  ctx.font = `14px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("WhatsApp Toolkit", W / 2, H - 100);
}

// ── Component ─────────────────────────────────────────────────────

export default function GreetingGeneratorScreen() {
  const colors = useColors();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [occasion, setOccasion] = useState("birthday");
  const [recipientName, setRecipientName] = useState("");
  const [language, setLanguage] = useState("English");
  const [cardTheme, setCardTheme] = useState("royal_gold");
  const [cardStyle, setCardStyle] = useState("heartfelt");
  const [customDetails, setCustomDetails] = useState("");
  const [greetingText, setGreetingText] = useState("");
  const [cardDataUrl, setCardDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedOccasion = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
  const selectedTheme = CARD_THEMES.find((t) => t.id === cardTheme) || CARD_THEMES[0];
  const selectedStyle = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0];

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setCustomDetails(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setCardDataUrl("");
    setGreetingText("");

    try {
      const occasionLabel = selectedOccasion.label.replace(/^[^\s]+\s/, "");
      const styleName = selectedStyle.label.replace(/^[^\s]+\s/, "");
      const namePart = recipientName.trim()
        ? ` The greeting is for "${recipientName.trim()}". Include their name naturally.`
        : "";
      const detailsPart = customDetails.trim()
        ? ` Additional context: ${customDetails.trim()}.`
        : "";

      const prompt = `Generate a beautiful ${styleName.toLowerCase()} greeting message for ${occasionLabel}.${namePart}${detailsPart}

Language: ${language}

Requirements:
- Create a warm, genuine greeting (4-8 lines)
- Use line breaks for visual formatting
- If Poetic/Shayari style, write in verse format
- If Religious style, include blessings
- Keep it 40-80 words
- Output ONLY the greeting text, no quotes or labels`;

      const response = await chat(prompt);
      setGreetingText(response);

      // Generate the card image using Canvas (web only)
      if (Platform.OS === "web") {
        const canvas = canvasRef.current || document.createElement("canvas");
        if (!canvasRef.current) canvasRef.current = canvas;
        drawCardOnCanvas(canvas, selectedTheme, response, occasionLabel);
        const dataUrl = canvas.toDataURL("image/png");
        setCardDataUrl(dataUrl);
      }

      await addHistory("Greeting Card", `${occasionLabel} - ${styleName} - ${language}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("API key not set") && !msg.includes("API key required")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!cardDataUrl) return;
    try {
      const a = document.createElement("a");
      a.href = cardDataUrl;
      a.download = "greeting_card.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Alert.alert("Success", "Greeting card downloaded!");
    } catch {
      Alert.alert("Error", "Failed to download.");
    }
  }, [cardDataUrl]);

  const handleShare = useCallback(async () => {
    if (!cardDataUrl) return;
    try {
      const res = await fetch(cardDataUrl);
      const blob = await res.blob();
      if (navigator.share) {
        const file = new File([blob], "greeting_card.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Greeting Card" });
          return;
        }
      }
      // Fallback: copy text
      await Clipboard.setStringAsync(greetingText);
      Alert.alert("Copied", "Greeting text copied to clipboard!");
    } catch {
      await Clipboard.setStringAsync(greetingText);
      Alert.alert("Copied", "Greeting text copied to clipboard!");
    }
  }, [cardDataUrl, greetingText]);

  const handleCopyText = useCallback(async () => {
    if (!greetingText) return;
    await Clipboard.setStringAsync(greetingText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Greeting text copied to clipboard!");
  }, [greetingText]);

  const handleRegenerate = useCallback(() => {
    if (!greetingText || !cardDataUrl) return;
    // Re-render the canvas with the same text but different style if desired
    if (Platform.OS === "web") {
      const occasionLabel = selectedOccasion.label.replace(/^[^\s]+\s/, "");
      const canvas = canvasRef.current || document.createElement("canvas");
      if (!canvasRef.current) canvasRef.current = canvas;
      drawCardOnCanvas(canvas, selectedTheme, greetingText, occasionLabel);
      const dataUrl = canvas.toDataURL("image/png");
      setCardDataUrl(dataUrl);
    }
  }, [greetingText, cardDataUrl, selectedTheme, selectedOccasion]);

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
              Greeting Card
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
        {/* ── Occasion ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OCCASION</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {OCCASIONS.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.chip,
                    occasion === item.id
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setOccasion(item.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      occasion === item.id
                        ? styles.chipTextSelected
                        : { color: colors.foreground },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Recipient Name ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              NAME ON CARD (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="e.g. Rahul, Mom, Priya..."
              placeholderTextColor={colors.mutedForeground}
              value={recipientName}
              onChangeText={setRecipientName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* ── Card Theme ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              CARD THEME
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CARD_THEMES.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.themeChip,
                    {
                      borderColor:
                        cardTheme === item.id ? item.accent : colors.border,
                      borderWidth: cardTheme === item.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setCardTheme(item.id);
                    // Re-render if card already exists
                    if (greetingText && Platform.OS === "web") {
                      const occasionLabel = selectedOccasion.label.replace(/^[^\s]+\s/, "");
                      const canvas = canvasRef.current || document.createElement("canvas");
                      if (!canvasRef.current) canvasRef.current = canvas;
                      const theme = CARD_THEMES.find((t) => t.id === item.id) || CARD_THEMES[0];
                      drawCardOnCanvas(canvas, theme, greetingText, occasionLabel);
                      setCardDataUrl(canvas.toDataURL("image/png"));
                    }
                  }}
                >
                  <View style={[styles.themePreview, { backgroundColor: item.bg1 }]}>
                    <View
                      style={[
                        styles.themeAccentDot,
                        { backgroundColor: item.accent },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color:
                          cardTheme === item.id ? colors.foreground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Greeting Style ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              GREETING STYLE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CARD_STYLES.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.chip,
                    cardStyle === item.id
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setCardStyle(item.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      cardStyle === item.id
                        ? styles.chipTextSelected
                        : { color: colors.foreground },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Language ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              POSTER LANGUAGE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {LANGUAGES.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.chip,
                    language === item
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setLanguage(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      language === item
                        ? styles.chipTextSelected
                        : { color: colors.foreground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Custom Details ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                CUSTOM DETAILS (OPTIONAL)
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
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="e.g. We've been friends for 10 years, mention our trip to Goa..."
              placeholderTextColor={colors.mutedForeground}
              value={customDetails}
              onChangeText={setCustomDetails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── API Key Warning ── */}
        <View style={styles.sectionWrap}>
          <ApiKeyWarning />
        </View>

        {/* ── Generate Button ── */}
        <View style={styles.sectionWrap}>
          <Pressable
            style={[
              styles.generateBtn,
              {
                backgroundColor: loading ? colors.muted : GREEN,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#FFF" />
            ) : (
              <>
                <Feather name="image" size={18} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate Greeting Card</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.sectionWrap}>
            <View
              style={[styles.errorBox, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}
            >
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => setError("")} hitSlop={8}>
                <Feather name="x" size={16} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ── Generated Card Result ── */}
        {cardDataUrl ? (
          <View style={styles.sectionWrap}>
            <View
              style={[
                styles.resultCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                GENERATED GREETING CARD
              </Text>

              {/* Card Image */}
              <View style={[styles.imageContainer, { backgroundColor: colors.muted }]}>
                {/* @ts-ignore - web-only img element for data URL */}
                <img
                  src={cardDataUrl}
                  alt="Greeting Card"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 8,
                    display: "block",
                  }}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.resultActions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: `${GREEN}18` }]}
                  onPress={handleDownload}
                >
                  <Feather name="download" size={16} color={GREEN} />
                  <Text style={[styles.actionBtnText, { color: GREEN }]}>Save</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, { backgroundColor: `${colors.primary}18` }]}
                  onPress={handleShare}
                >
                  <Feather name="share-2" size={16} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, { backgroundColor: `${colors.primary}18` }]}
                  onPress={handleCopyText}
                >
                  <Feather name="copy" size={16} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Copy Text</Text>
                </Pressable>
              </View>

              {/* Tip: Change theme */}
              <View style={[styles.tipRow, { backgroundColor: `${GREEN}10` }]}>
                <Feather name="info" size={14} color={GREEN} />
                <Text style={[styles.tipText, { color: GREEN }]}>
                  Change the Card Theme above and the card will update instantly!
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
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

  sectionWrap: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },

  card: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },

  chipRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },

  /* Theme Chips */
  themeChip: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    minWidth: 80,
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  themeAccentDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },

  textInput: {
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  multilineInput: {
    minHeight: 80,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
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

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#EF4444",
  },

  resultCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },

  imageContainer: {
    borderRadius: RADIUS_SM,
    overflow: "hidden",
  },

  resultActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS_SM,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS_SM,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
