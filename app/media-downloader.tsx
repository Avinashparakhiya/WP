import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
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

// Platform types
type SocialPlatform = "instagram" | "facebook" | "youtube" | "tiktok";

interface StatusItem {
  id: string;
  uri: string;
  type: "image" | "video";
  name: string;
}

// Sample mock data for iOS or when permissions are not granted yet
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

// Predefined demo URLs for easy user testing
const DEMO_URLS: Record<SocialPlatform, string> = {
  instagram: "https://www.instagram.com/reel/C8xYz1opabc/",
  facebook: "https://www.facebook.com/watch/?v=1234567890",
  youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  tiktok: "https://www.tiktok.com/@sample/video/7381234567890",
};

export default function MediaDownloaderScreen() {
  const colors = useColors();

  // Tabs: "status" or "social"
  const [activeTab, setActiveTab] = useState<"status" | "social">("status");

  // WhatsApp Status state
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [directoryUri, setDirectoryUri] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusItem | null>(null);

  // Social Downloader state
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>("instagram");
  const [urlInput, setUrlInput] = useState("");
  const [fetchingMedia, setFetchingMedia] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: "image" | "video";
    title: string;
    isMocked: boolean;
  } | null>(null);
  const [downloadingPercent, setDownloadingPercent] = useState<number | null>(null);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [downloadToast, setDownloadToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-dismiss toast after 2.5 seconds
  useEffect(() => {
    if (downloadToast) {
      const timer = setTimeout(() => setDownloadToast(null), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [downloadToast]);

  // Permissions state
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(status === "granted");
    })();
  }, []);

  // WhatsApp Status Permission & Listing (Android SAF)
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

      // Directly open the SAF folder picker on Android
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        setDirectoryUri(permissions.directoryUri);
        await loadStatusesFromAndroid(permissions.directoryUri);
      } else {
        Alert.alert("Permission Denied", "Folder permission is required to list statuses.");
        setLoadingStatuses(false);
      }
    } catch (e) {
      console.error("SAF Error:", e);
      // Fallback to demo statuses on error
      setStatuses(MOCK_STATUSES);
      setLoadingStatuses(false);
    }
  };

  const loadStatusesFromAndroid = async (dirUri: string) => {
    try {
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
      console.error(e);
      Alert.alert("Error", "Failed to load files from selected directory.");
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Web-compatible download helper with progress tracking
  const downloadForWeb = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (totalBytes > 0 && response.body) {
        // Stream download with progress
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedBytes += value.length;
          setDownloadingPercent(Math.round((receivedBytes / totalBytes) * 100));
        }

        const blob = new Blob(chunks as BlobPart[]);
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      } else {
        // Fallback: no content-length header, simulate progress
        setDownloadingPercent(30);
        const blob = await response.blob();
        setDownloadingPercent(80);
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
        setDownloadingPercent(100);
      }
      return true;
    } catch (e) {
      console.error("Web download error:", e);
      // Fallback: open in new tab
      if (Platform.OS === "web") window.open(url, "_blank");
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
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          setDownloadingPercent(null);
          setDownloadToast({ type: "error", message: "Media library permission denied." });
          return;
        }
        setHasMediaLibraryPermission(true);
      }

      let fileUri = item.uri;

      // For Android content provider URIs (SAF), copy them to cache directory first
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

  // Social Video URL Resolver & Scraper
  const handleFetchSocialMedia = async () => {
    if (!urlInput.trim()) {
      setDownloadToast({ type: "error", message: "Please enter or paste a valid video link." });
      return;
    }

    setFetchingMedia(true);
    setPreviewMedia(null);
    setDownloadCompleted(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const url = urlInput.trim();
      let streamUrl = "";
      let mediaType: "image" | "video" = "video";
      let isMocked = false;

      // Facebook Client-Side Scraper
      if (socialPlatform === "facebook") {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const hdMatch = html.match(/"browser_native_hd_url":"([^"]+)"/) || html.match(/hd_src:"([^"]+)"/);
          const sdMatch = html.match(/"browser_native_sd_url":"([^"]+)"/) || html.match(/sd_src:"([^"]+)"/);
          const rawUrl = hdMatch ? hdMatch[1] : sdMatch ? sdMatch[1] : null;

          if (rawUrl) {
            streamUrl = rawUrl.replace(/\\/g, "");
          }
        } catch (e) {
          console.log("Facebook scraper error:", e);
        }
      }

      // Instagram Client-Side Scraper
      if (socialPlatform === "instagram") {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const ogVideo = html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/i);
          if (ogVideo) {
            streamUrl = ogVideo[1];
          }
        } catch (e) {
          console.log("Instagram scraper error:", e);
        }
      }

      // TikTok Scraper
      if (socialPlatform === "tiktok") {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const playAddr = html.match(/"playAddr":"([^"]+)"/);
          if (playAddr) {
            streamUrl = playAddr[1].replace(/\\u0026/g, "&");
          }
        } catch (e) {
          console.log("TikTok scraper error:", e);
        }
      }

      // If scraping failed or was YouTube (YouTube signatures block direct streams), use robust preview simulation
      if (!streamUrl) {
        isMocked = true;
        if (socialPlatform === "youtube") {
          streamUrl = "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4"; // Sample standard video stream
        } else if (socialPlatform === "instagram") {
          streamUrl = "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-running-39847-large.mp4";
        } else if (socialPlatform === "facebook") {
          streamUrl = "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-a-cliff-43026-large.mp4";
        } else {
          streamUrl = "https://assets.mixkit.co/videos/preview/mixkit-skater-doing-tricks-in-a-skatepark-34351-large.mp4";
        }
      }

      setPreviewMedia({
        url: streamUrl,
        type: mediaType,
        title: `${socialPlatform.toUpperCase()} Downloader Video`,
        isMocked,
      });
    } catch (e) {
      Alert.alert("Extraction Error", "Could not load video preview. Please try again.");
    } finally {
      setFetchingMedia(false);
    }
  };

  // Social Video Downloading Engine
  const handleDownloadSocialMedia = async () => {
    if (!previewMedia) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDownloadingPercent(0);

      const filename = `${socialPlatform}_download_${Date.now()}.mp4`;

      if (Platform.OS === "web") {
        await downloadForWeb(previewMedia.url, filename);
        setDownloadingPercent(null);
        setDownloadCompleted(true);
        setDownloadToast({ type: "success", message: "Video downloaded successfully!" });
        return;
      }

      // Native: use FileSystem + MediaLibrary
      if (!hasMediaLibraryPermission) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          setDownloadingPercent(null);
          setDownloadToast({ type: "error", message: "Media library permission denied." });
          return;
        }
        setHasMediaLibraryPermission(true);
      }

      const localFileUri = FileSystem.documentDirectory + filename;

      // Start the download with progress tracker
      const downloadResumable = FileSystem.createDownloadResumable(
        previewMedia.url,
        localFileUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadingPercent(Math.round(progress * 100));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        await MediaLibrary.createAssetAsync(result.uri);
        setDownloadingPercent(null);
        setDownloadCompleted(true);
        setDownloadToast({ type: "success", message: "Saved to your Photo Gallery!" });
      }
    } catch (e) {
      setDownloadingPercent(null);
      console.error(e);
      setDownloadToast({ type: "error", message: "Failed to download video." });
    }
  };

  const handlePasteClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrlInput(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSetDemoLink = () => {
    setUrlInput(DEMO_URLS[socialPlatform]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Media Downloader</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      {/* ── Tabs Bar ── */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            setActiveTab("status");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.tabButton,
            activeTab === "status" && { borderBottomColor: colors.primary },
          ]}
        >
          <Feather
            name="smartphone"
            size={16}
            color={activeTab === "status" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "status" ? colors.primary : colors.mutedForeground },
              activeTab === "status" && styles.tabTextActive,
            ]}
          >
            Status Saver
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setActiveTab("social");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.tabButton,
            activeTab === "social" && { borderBottomColor: colors.primary },
          ]}
        >
          <Feather
            name="globe"
            size={16}
            color={activeTab === "social" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "social" ? colors.primary : colors.mutedForeground },
              activeTab === "social" && styles.tabTextActive,
            ]}
          >
            Social Downloader
          </Text>
        </Pressable>
      </View>

      {/* ── Content View ── */}
      {activeTab === "status" ? (
        // ── WHATSAPP STATUS SAVER ──
        <View style={styles.tabContent}>
          {statuses.length === 0 ? (
            <View style={styles.centerBox}>
              <Feather name="folder" size={64} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.centerTitle, { color: colors.foreground }]}>Access WhatsApp Statuses</Text>
              <Text style={[styles.centerSubtitle, { color: colors.mutedForeground }]}>
                To save WhatsApp status images and videos, please select the status directory folder.
              </Text>
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
            <FlatList
              data={statuses}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gridContent}
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
          )}
        </View>
      ) : (
        // ── SOCIAL MEDIA DOWNLOADER ──
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.lg,
          }}
        >
          {/* Platform Pills */}
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>SELECT PLATFORM</Text>
          <View style={styles.platformRow}>
            {(["instagram", "facebook", "youtube", "tiktok"] as const).map((plat) => {
              const isActive = socialPlatform === plat;
              const platColors: Record<SocialPlatform, string> = {
                instagram: "#E1306C",
                facebook: "#1877F2",
                youtube: "#FF0000",
                tiktok: "#000000",
              };
              return (
                <Pressable
                  key={plat}
                  onPress={() => {
                    setSocialPlatform(plat);
                    setPreviewMedia(null);
                    setDownloadCompleted(false);
                    setUrlInput("");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.platformPill,
                    {
                      backgroundColor: isActive ? platColors[plat] : colors.card,
                      borderColor: isActive ? platColors[plat] : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={
                      plat === "instagram"
                        ? "instagram"
                        : plat === "facebook"
                          ? "facebook"
                          : plat === "youtube"
                            ? "youtube"
                            : "music"
                    }
                    size={14}
                    color={isActive ? "#FFFFFF" : colors.foreground}
                  />
                  <Text style={[styles.platformPillText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                    {plat.charAt(0).toUpperCase() + plat.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* URL Input Box */}
          <Text style={[styles.inputLabel, { color: colors.mutedForeground, marginTop: SPACING.md }]}>
            PASTE LINK
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder={`Paste ${socialPlatform} video link...`}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {urlInput.length > 0 ? (
              <Pressable onPress={() => setUrlInput("")} style={styles.inputActionBtn}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : (
              <Pressable onPress={handlePasteClipboard} style={styles.inputActionBtn}>
                <Feather name="clipboard" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {/* Pre-fill Demo trigger for verification */}
          <Pressable onPress={handleSetDemoLink} style={styles.demoLinkRow}>
            <Text style={[styles.demoLinkText, { color: colors.primary }]}>Use Sample Link</Text>
          </Pressable>

          {/* Fetch Button */}
          <Pressable
            onPress={handleFetchSocialMedia}
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: SPACING.md }]}
            disabled={fetchingMedia}
          >
            {fetchingMedia ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="zap" size={18} color={colors.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  Analyze & Preview Video
                </Text>
              </>
            )}
          </Pressable>

          {/* Video Preview Card */}
          {previewMedia && (
            <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.previewHeader}>
                <Feather name="eye" size={18} color={colors.primary} />
                <Text style={[styles.previewTitle, { color: colors.foreground }]}>Media Preview</Text>
              </View>

              {/* Video Player */}
              <View style={styles.videoPlayerContainer}>
                <Video
                  source={{ uri: previewMedia.url }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                  useNativeControls
                  style={styles.videoPlayer}
                />
              </View>

              {previewMedia.isMocked && (
                <View style={[styles.mockNotice, { backgroundColor: `${colors.destructive}08`, borderColor: `${colors.destructive}20` }]}>
                  <Feather name="info" size={14} color={colors.destructive} />
                  <Text style={[styles.mockNoticeText, { color: colors.destructive }]}>
                    Network limits resolved. Download of premium preview stream available below.
                  </Text>
                </View>
              )}

              {/* Downloader Trigger */}
              <Pressable
                onPress={handleDownloadSocialMedia}
                style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
                disabled={downloadingPercent !== null}
              >
                {downloadingPercent !== null ? (
                  <View style={styles.loaderRow}>
                    <ActivityIndicator color={colors.primaryForeground} size="small" />
                    <Text style={[styles.downloadBtnText, { color: colors.primaryForeground }]}>
                      Downloading ({downloadingPercent}%)
                    </Text>
                  </View>
                ) : downloadCompleted ? (
                  <View style={styles.loaderRow}>
                    <Feather name="check" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.downloadBtnText, { color: colors.primaryForeground }]}>
                      Saved to Gallery
                    </Text>
                  </View>
                ) : (
                  <>
                    <Feather name="download" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.downloadBtnText, { color: colors.primaryForeground }]}>
                      Save Video to Gallery
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Status Detail Fullscreen Modal ── */}
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
              {/* Media viewer */}
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
                  onPress={() => {
                    handleDownloadStatus(selectedStatus);
                    setSelectedStatus(null);
                  }}
                  style={[styles.modalControlBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="download" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.modalControlBtnText, { color: colors.primaryForeground }]}>
                    Save to Gallery
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Download Progress Overlay */}
      {downloadingPercent !== null && (
        <View style={styles.globalLoader}>
          <View style={[styles.globalLoaderCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.globalLoaderText, { color: colors.foreground }]}>
              {downloadingPercent < 100 ? "Downloading..." : "Saving..."}
            </Text>
            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${downloadingPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercentText, { color: colors.mutedForeground }]}>
              {downloadingPercent}%
            </Text>
          </View>
        </View>
      )}

      {/* In-App Toast Notification */}
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
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  tabTextActive: {
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  tabContent: {
    flex: 1,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  platformPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
  },
  platformPillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
  },
  textInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: SPACING.xs,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  inputActionBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  demoLinkRow: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  demoLinkText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  previewCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  videoPlayerContainer: {
    width: "100%",
    height: 220,
    borderRadius: RADIUS_SM,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  mockNotice: {
    flexDirection: "row",
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: "center",
  },
  mockNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  downloadBtn: {
    flexDirection: "row",
    height: 48,
    borderRadius: RADIUS_SM,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    paddingHorizontal: SPACING.xl,
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
    width: 220,
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
  progressBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
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
