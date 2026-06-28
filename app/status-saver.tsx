import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Video, ResizeMode } from "expo-av";
import { useColors } from "../lib/useColors";
import {
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
  RADIUS,
  RADIUS_SM,
  SPACING,
} from "../constants/layout";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;

interface StatusItem {
  id: string;
  uri: string;
  type: "image" | "video";
  name: string;
}

const MOCK_STATUSES: StatusItem[] = [
  {
    id: "mock-1",
    uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop",
    type: "image",
    name: "status_photo_1.jpg",
  },
  {
    id: "mock-2",
    uri: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop",
    type: "image",
    name: "status_photo_2.jpg",
  },
  {
    id: "mock-3",
    uri: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
    type: "video",
    name: "status_video_1.mp4",
  },
  {
    id: "mock-4",
    uri: "https://images.unsplash.com/photo-1472214222541-d510753a4907?w=600&auto=format&fit=crop",
    type: "image",
    name: "status_photo_3.jpg",
  },
];

export default function StatusSaverScreen() {
  const colors = useColors();

  // WhatsApp Status state
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [directoryUri, setDirectoryUri] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusItem | null>(null);
  const [downloadingPercent, setDownloadingPercent] = useState<number | null>(null);
  const [downloadToast, setDownloadToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Permissions state
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);

  // Check iOS platform on mount and show Alert Notice
  useEffect(() => {
    if (Platform.OS === "ios") {
      Alert.alert(
        "Notice",
        "This feature is only for Android users only.",
        [
          {
            text: "OK",
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web" && Platform.OS !== "ios") {
        try {
          const { status } = await MediaLibrary.getPermissionsAsync(true);
          setHasMediaLibraryPermission(status === "granted");
        } catch (e) {
          console.log("Failed to get media permissions on mount:", e);
          setHasMediaLibraryPermission(false);
        }
      }
    })();
  }, []);

  // Auto-dismiss toast after 2.5 seconds
  useEffect(() => {
    if (downloadToast) {
      const timer = setTimeout(() => setDownloadToast(null), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [downloadToast]);

  // SAF Folder Picker for Android Status folder
  const handleRequestStatusFolder = async () => {
    if (Platform.OS !== "android") {
      // On web/iOS, SAF is not available — load demo statuses directly
      setStatuses(MOCK_STATUSES);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    try {
      setLoadingStatuses(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Open the SAF folder picker
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        setDirectoryUri(permissions.directoryUri);
        await loadStatusesFromAndroid(permissions.directoryUri);
      } else {
        Alert.alert("Permission Denied", "Folder permission is required to view statuses.");
        setLoadingStatuses(false);
      }
    } catch (e) {
      console.error("SAF Folder Permission Error:", e);
      setStatuses(MOCK_STATUSES);
      setLoadingStatuses(false);
    }
  };

  const loadStatusesFromAndroid = async (dirUri: string) => {
    try {
      setLoadingStatuses(true);
      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(dirUri);
      const items: StatusItem[] = [];

      for (const fileUri of files) {
        const decodedUri = decodeURIComponent(fileUri);
        const name = decodedUri.substring(decodedUri.lastIndexOf("/") + 1);

        if (name.startsWith(".") || name === "") continue;

        const isImage = /\.(jpe?g|png|webp)$/i.test(name);
        const isVideo = /\.(mp4|3gp|mkv|webm)$/i.test(name);

        if (isImage) {
          items.push({ id: fileUri, uri: fileUri, type: "image", name });
        } else if (isVideo) {
          items.push({ id: fileUri, uri: fileUri, type: "video", name });
        }
      }

      setStatuses(items);
      if (items.length === 0) {
        Alert.alert("No Statuses Found", "Ensure WhatsApp is installed and you have viewed statuses recently.");
      }
    } catch (e) {
      console.error("Error reading statuses:", e);
      Alert.alert("Error", "Failed to load files from selected directory.");
    } finally {
      setLoadingStatuses(false);
    }
  };

  const handleRefresh = async () => {
    if (Platform.OS === "android" && directoryUri) {
      await loadStatusesFromAndroid(directoryUri);
    } else {
      setStatuses(MOCK_STATUSES);
    }
  };

  // Web-compatible download helper
  const downloadForWeb = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
      return true;
    } catch (e) {
      console.error("Web download error:", e);
      window.open(url, "_blank");
      return true;
    }
  };

  const handleDownloadStatus = async (item: StatusItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDownloadingPercent(0);

      if (Platform.OS === "web") {
        await downloadForWeb(item.uri, item.name);
        setDownloadingPercent(null);
        setDownloadToast({ type: "success", message: "Downloaded successfully!" });
        return;
      }

      // Native: use MediaLibrary
      if (!hasMediaLibraryPermission) {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync(true);
          if (status !== "granted") {
            setDownloadingPercent(null);
            setDownloadToast({ type: "error", message: "Media library permission denied." });
            return;
          }
          setHasMediaLibraryPermission(true);
        } catch (e) {
          console.log("Failed to request media permissions on download:", e);
          setDownloadingPercent(null);
          setDownloadToast({
            type: "error",
            message: "Permission error. Please rebuild your app client.",
          });
          return;
        }
      }

      let fileUri = item.uri;

      // Copy Android content provider SAF URI to cache folder first
      if (fileUri.startsWith("content://")) {
        const cacheDir = FileSystem.cacheDirectory + "statuses/";
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        const localCachePath = cacheDir + item.name;

        await FileSystem.copyAsync({
          from: fileUri,
          to: localCachePath,
        });
        fileUri = localCachePath;
      } else if (fileUri.startsWith("http")) {
        const localCachePath = FileSystem.cacheDirectory + item.name;
        const downloadResult = await FileSystem.downloadAsync(fileUri, localCachePath);
        fileUri = downloadResult.uri;
      }

      await MediaLibrary.createAssetAsync(fileUri);
      setDownloadingPercent(null);
      setDownloadToast({ type: "success", message: "Saved to your Photo Gallery!" });
    } catch (err) {
      setDownloadingPercent(null);
      console.error(err);
      setDownloadToast({ type: "error", message: "Failed to download status." });
    }
  };

  const handleShareStatus = async (item: StatusItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      let fileUri = item.uri;

      // Copy SAF URI to temporary cache folder for sharing
      if (fileUri.startsWith("content://")) {
        const cacheDir = FileSystem.cacheDirectory + "share_temp/";
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        const localCachePath = cacheDir + item.name;

        await FileSystem.copyAsync({
          from: fileUri,
          to: localCachePath,
        });
        fileUri = localCachePath;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Sharing Unavailable", "Sharing is not supported on this device.");
      }
    } catch (err) {
      console.error("Share error:", err);
      Alert.alert("Error", "Could not share this status.");
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
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
                if (router.canGoBack()) router.back();
                else router.replace("/");
              }}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Status Saver</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      {/* Main Content Area */}
      {Platform.OS === "ios" ? (
        <View style={styles.centerBox}>
          <Feather name="alert-triangle" size={64} color={colors.destructive} style={{ marginBottom: 16 }} />
          <Text style={[styles.centerTitle, { color: colors.foreground }]}>iOS Sandbox Restrictions</Text>
          <Text style={[styles.centerSubtitle, { color: colors.mutedForeground }]}>
            This feature is only for Android users only due to iOS security container policies.
          </Text>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
          >
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>OK, Go Back</Text>
          </Pressable>
        </View>
      ) : statuses.length === 0 ? (
        <View style={styles.centerBox}>
          <Feather name="folder" size={64} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
          <Text style={[styles.centerTitle, { color: colors.foreground }]}>Access WhatsApp Statuses</Text>
          <Text style={[styles.centerSubtitle, { color: colors.mutedForeground }]}>
            To save viewed WhatsApp statuses, grant directory access folder to scan cached media files.
          </Text>

          <View style={[styles.guideBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.guideTitle, { color: colors.foreground }]}>Android 11+ Setup Guide:</Text>
            <Text style={[styles.guideStep, { color: colors.mutedForeground }]}>
              1. View the status first in WhatsApp messenger.{"\n"}
              2. Tap "Grant Folder Access" below.{"\n"}
              3. Select directory:{"\n"}
              <Text style={{ fontWeight: "700" }}>Android/media/com.whatsapp/WhatsApp/Media/.Statuses</Text>{"\n"}
              4. Tap "Use This Folder" and choose allow.
            </Text>
          </View>

          <Pressable
            onPress={handleRequestStatusFolder}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            {loadingStatuses ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="folder-plus" size={18} color={colors.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  Grant Folder Access
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => setStatuses(MOCK_STATUSES)}
            style={[styles.demoBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.demoBtnText, { color: colors.foreground }]}>Show Demo Statuses</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={statuses}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={[styles.gridContent, { paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.lg }]}
            onRefresh={handleRefresh}
            refreshing={loadingStatuses}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedStatus(item)}
                style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Image source={{ uri: item.uri }} style={styles.gridImage} />
                {item.type === "video" && (
                  <View style={styles.playIconOverlay}>
                    <Feather name="play" size={24} color="#FFFFFF" />
                  </View>
                )}
                <Pressable
                  onPress={() => handleDownloadStatus(item)}
                  style={styles.downloadIconBadge}
                >
                  <Feather name="download" size={14} color="#FFFFFF" />
                </Pressable>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Status Detail Modal */}
      <Modal
        visible={selectedStatus !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedStatus(null)}
      >
        <View style={styles.modalBg}>
          <Pressable onPress={() => setSelectedStatus(null)} style={styles.modalCloseOverlay} />
          {selectedStatus && (
            <View style={styles.modalContainer}>
              {selectedStatus.type === "image" ? (
                <Image source={{ uri: selectedStatus.uri }} style={styles.modalImage} resizeMode="contain" />
              ) : (
                <Video
                  source={{ uri: selectedStatus.uri }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isLooping={true}
                  useNativeControls
                  style={styles.modalVideo}
                />
              )}

              {/* Controls */}
              <View style={styles.modalControlRow}>
                <Pressable
                  onPress={() => setSelectedStatus(null)}
                  style={[styles.modalControlBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                >
                  <Text style={styles.modalControlBtnText}>Close</Text>
                </Pressable>
                
                <Pressable
                  onPress={() => handleShareStatus(selectedStatus)}
                  style={[styles.modalControlBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                >
                  <Feather name="share-2" size={16} color="#FFFFFF" />
                  <Text style={styles.modalControlBtnText}>Share</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    handleDownloadStatus(selectedStatus);
                    setSelectedStatus(null);
                  }}
                  style={[styles.modalControlBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="download" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.modalControlBtnText, { color: colors.primaryForeground }]}>
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Progress Indicator Overlay */}
      {downloadingPercent !== null && (
        <View style={styles.globalLoader}>
          <View style={[styles.globalLoaderCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.globalLoaderText, { color: colors.foreground }]}>
              Saving...
            </Text>
          </View>
        </View>
      )}

      {/* Toast Alert */}
      {downloadToast && (
        <View style={styles.toastContainer}>
          <View
            style={[
              styles.toastCard,
              {
                backgroundColor:
                  downloadToast.type === "success" ? "#059669" : "#DC2626",
              },
            ]}
          >
            <Feather
              name={downloadToast.type === "success" ? "check-circle" : "alert-circle"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.toastText}>{downloadToast.message}</Text>
          </View>
        </View>
      )}
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
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
    paddingBottom: 40,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  centerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  guideBox: {
    width: "100%",
    padding: SPACING.md,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: SPACING.xs,
  },
  guideStep: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 48,
    borderRadius: RADIUS_SM,
    paddingHorizontal: SPACING.xl,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  demoBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  gridContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  gridCard: {
    width: COLUMN_SIZE,
    height: COLUMN_SIZE * 1.4,
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: "hidden",
    marginRight: SPACING.md,
    marginBottom: SPACING.sm,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  downloadIconBadge: {
    position: "absolute",
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: "90%",
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "80%",
  },
  modalVideo: {
    width: "100%",
    height: "80%",
  },
  modalControlRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  modalControlBtn: {
    flexDirection: "row",
    height: 46,
    borderRadius: RADIUS_SM,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalControlBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  globalLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  globalLoaderCard: {
    width: 200,
    borderRadius: RADIUS,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  globalLoaderText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 200,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
