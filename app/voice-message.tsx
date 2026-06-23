import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  PermissionsAndroid,
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
import { Header } from "../components/Header";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AiErrorBox } from "../components/AiErrorBox";
import { ApiKeyWarning } from "../components/ApiKeyWarning";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { transcribeAudio } from "../lib/openai";
import { addHistory } from "../lib/storage";

export default function VoiceMessageScreen() {
  const colors = useColors();
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [editedText, setEditedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "This app needs microphone access to record audio.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleStartRecording = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Microphone permission is required for recording.");
      return;
    }

    setRecording(true);
    setHasRecording(false);
    setTranscription("");
    setEditedText("");
    setError("");
    setDuration(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    // Simulate recording (in a real app, use expo-av Audio.recording)
    // For demo purposes, we'll just track the time
  };

  const handleStopRecording = () => {
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHasRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTranscribe = async () => {
    if (!hasRecording) return;
    setLoading(true);
    setError("");
    try {
      // In production, this would use a real audio URI from expo-av
      const result = await transcribeAudio("");
      setTranscription(result);
      setEditedText(result);
      await addHistory("Voice Message", result);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Transcription failed. Make sure your OpenAI API key is set in Settings.";
      if (!msg.includes("API key not set") && !msg.includes("API key required")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="Voice to Message" subtitle="Record & transcribe audio" />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <View style={styles.content}>
        {/* Recording section */}
        <View
          style={[
            styles.recordCard,
            {
              backgroundColor: colors.card,
              borderColor: recording ? colors.destructive : colors.border,
            },
          ]}
        >
          <Text style={[styles.recordLabel, { color: colors.foreground }]}>
            {recording ? "Recording..." : hasRecording ? "Recording Complete" : "Tap to Record"}
          </Text>
          {recording || hasRecording ? (
            <Text style={[styles.duration, { color: colors.mutedForeground }]}>
              {formatDuration(duration)}
            </Text>
          ) : null}

          {/* Waveform visualization placeholder */}
          <View style={styles.waveformContainer}>
            {recording
              ? Array.from({ length: 30 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        backgroundColor: colors.primary,
                        height: Math.random() * 30 + 10,
                      },
                    ]}
                  />
                ))
              : hasRecording
                ? Array.from({ length: 30 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          backgroundColor: colors.mutedForeground,
                          height: 10,
                        },
                      ]}
                    />
                  ))
                : Array.from({ length: 30 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          backgroundColor: colors.border,
                          height: 10,
                        },
                      ]}
                    />
                  ))}
          </View>

          <Pressable
            style={[
              styles.recordBtn,
              {
                backgroundColor: recording
                  ? colors.destructive
                  : hasRecording
                    ? `${colors.primary}20`
                    : colors.primary,
              },
            ]}
            onPress={recording ? handleStopRecording : handleStartRecording}
          >
            <Feather
              name={recording ? "square" : "mic"}
              size={24}
              color={recording ? "#FFFFFF" : hasRecording ? colors.primary : "#FFFFFF"}
            />
            <Text
              style={[
                styles.recordBtnText,
                { color: recording ? "#FFFFFF" : hasRecording ? colors.primary : "#FFFFFF" },
              ]}
            >
              {recording ? "Stop Recording" : hasRecording ? "Record Again" : "Start Recording"}
            </Text>
          </Pressable>
        </View>

        {hasRecording ? (
          <>
            <ApiKeyWarning providerOnly="openai" />
            <Pressable
              style={[
                styles.transcribeBtn,
                { backgroundColor: loading ? colors.muted : colors.primary },
              ]}
              onPress={handleTranscribe}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Feather name="type" size={18} color="#FFFFFF" />
                  <Text style={styles.transcribeBtnText}>Transcribe Audio</Text>
                </>
              )}
            </Pressable>
          </>
        ) : null}

        {error ? <AiErrorBox error={error} onDismiss={() => setError("")} /> : null}

        {transcription ? (
          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
              Transcription
            </Text>
            <TextInput
              style={[
                styles.resultInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              value={editedText}
              onChangeText={setEditedText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              💡 Requires OpenAI API key. Set it in Settings even if you use Gemini/Groq for chat.
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  recordCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.md,
  },
  recordLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  duration: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: 50,
    width: "100%",
    overflow: "hidden",
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    marginTop: SPACING.sm,
  },
  recordBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  transcribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
  },
  transcribeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  resultCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultInput: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
