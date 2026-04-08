import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useChatMedia } from "@/hooks/useChatMedia";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, apiUploadRequest, fetchLocalBlob } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import { resolveMediaUri } from "@/lib/media";
import { useTranslation } from "@/lib/i18n";
import { parseImageUrls, formatMessageTime, getDateLabel, areDifferentDays } from "@/lib/chat-utils";
import { formatPrice } from "@/lib/formatters";
import { ScreenHeader } from "@/components/ScreenHeader";

interface SupportMessage {
  id: number;
  ticketId: number;
  senderId: string;
  senderRole: string;
  content: string;
  imageUrl: string | null;
  read: boolean;
  createdAt: string;
  senderName: string | null;
  senderUsername: string | null;
  listing?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    price: number;
    currency: string;
    photo: string | null;
    status: string;
    moderationNote?: string | null;
  } | null;
}

interface AttachedListing {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  photo: string | null;
  status: string;
  moderationNote?: string | null;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

let supportDraft = "";

export default function SupportChatScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ listingId?: string }>();

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState(() => supportDraft);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const { pendingImages, setPendingImages, showAttachPicker, setShowAttachPicker, handleAttach, handlePickerOption } = useChatMedia();
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [attachedListing, setAttachedListing] = useState<AttachedListing | null>(null);
  const lastTypingSentRef = useRef(0);
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;
  const listingFetchedRef = useRef(false);

  useEffect(() => {
    return () => {
      supportDraft = inputTextRef.current.trim();
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const res = await apiRequest("GET", API.support.chat);
      const data = await res.json();
      setTicketId(data.ticketId);
      setMessages(data.messages);
      queryClient.invalidateQueries({ queryKey: [API.support.unreadCount] });
    } catch (err) {
      setError(t("support.loadError"));
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!params.listingId || listingFetchedRef.current) return;
    const lid = parseInt(params.listingId, 10);
    if (isNaN(lid)) return;
    listingFetchedRef.current = true;
    (async () => {
      try {
        const res = await apiRequest("GET", API.listings.getById(lid));
        const data = await res.json();
        if (data && data.id) {
          const photo = Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : null;
          setAttachedListing({
            id: data.id,
            brand: data.brand,
            model: data.model,
            year: data.year,
            price: data.price,
            currency: data.currency,
            photo,
            status: data.status,
            moderationNote: data.moderationNote || null,
          });
        }
      } catch (e) {
        console.warn("Failed to fetch listing for attachment:", e);
      }
    })();
  }, [params.listingId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest("GET", API.support.chat);
        const data = await res.json();
        setTicketId(data.ticketId);
        setMessages(data.messages);
        queryClient.invalidateQueries({ queryKey: [API.support.unreadCount] });
      } catch (e) {
        console.warn("Poll support messages failed:", e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [queryClient]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest("GET", API.support.chatTypingStatus);
        const data = await res.json();
        setAdminTyping(data.typing);
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendTypingNotification = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    apiRequest("POST", API.support.chatTyping, {}).catch(() => {});
  }, []);

  const uploadImages = useCallback(async (imageUris: string[], content: string): Promise<SupportMessage> => {
    const formData = new FormData();

    if (Platform.OS === "web") {
      for (let i = 0; i < imageUris.length; i++) {
        const blob = await fetchLocalBlob(imageUris[i]);
        formData.append("images", blob, `photo_${i}.jpg`);
      }
    } else {
      const { File } = require("expo-file-system");
      for (const uri of imageUris) {
        const file = new File(uri);
        formData.append("images", file);
      }
    }
    if (content) formData.append("content", content);
    const res = await apiUploadRequest("POST", API.support.chatSendImage, formData);
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    const hasImages = pendingImages.length > 0;
    if ((!trimmed && !hasImages) || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentText = trimmed;
    const currentImages = [...pendingImages];
    setInputText("");
    supportDraft = "";
    setPendingImages([]);
    setSending(true);
    setShowAttachPicker(false);

    const photoLabel = currentImages.length > 1 ? `📷 ${t("chat.photosCount").replace("{count}", String(currentImages.length))}` : `📷 ${t("chat.photoLabel")}`;
    const optimisticImageUrl = currentImages.length === 1
      ? currentImages[0].uri
      : currentImages.length > 1
        ? JSON.stringify(currentImages.map((i) => i.uri))
        : null;

    const optimisticMsg: SupportMessage = {
      id: Date.now(),
      ticketId: ticketId || 0,
      senderId: user?.id || "",
      senderRole: "user",
      content: currentText || (hasImages ? photoLabel : ""),
      imageUrl: optimisticImageUrl,
      read: false,
      createdAt: new Date().toISOString(),
      senderName: null,
      senderUsername: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const currentListingId = attachedListing?.id || null;
    if (currentListingId) setAttachedListing(null);

    try {
      if (currentImages.length > 0) {
        await uploadImages(currentImages.map((i) => i.uri), currentText);
      } else {
        const body: any = { content: currentText };
        if (currentListingId) body.listingId = currentListingId;
        await apiRequest("POST", API.support.chatSend, body);
      }
      const res = await apiRequest("GET", API.support.chat);
      const data = await res.json();
      setMessages(data.messages);
      queryClient.invalidateQueries({ queryKey: [API.support.unreadCount] });
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(currentText);
      if (currentImages.length > 0) setPendingImages(currentImages);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, [inputText, pendingImages, sending, ticketId, user?.id, queryClient, uploadImages]);

  const invertedMessages = [...messages].reverse();

  const openImageViewer = useCallback((urls: string[], startIndex: number) => {
    setViewerImages(urls);
    setViewerIndex(startIndex);
    setViewerVisible(true);
  }, []);

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.senderRole === "user";
    const nextMessage = invertedMessages[index + 1];
    const showDateSeparator = !nextMessage || areDifferentDays(item.createdAt, nextMessage.createdAt);
    const imageUrls = parseImageUrls(item.imageUrl).map((u) => resolveMediaUri(u));
    const hasImages = imageUrls.length > 0;
    const hasTextContent = item.content && !item.content.startsWith("📷");
    const listing = item.listing;

    return (
      <View>
        <View style={[styles.messageBubbleRow, isUser ? styles.sentRow : styles.receivedRow]}>
          {!isUser && (
            <View style={[styles.adminAvatar, { backgroundColor: isDark ? colors.surfaceTertiary : colors.primary }]}>
              <Ionicons name={I.headset} size={14} color={isDark ? colors.textTertiary : colors.textInverse} />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isUser
                ? [styles.sentBubble, { backgroundColor: isDark ? (colors.accentBlue + '25') : colors.accentBlueLight }]
                : [styles.receivedBubble, { backgroundColor: isDark ? colors.surface : colors.surface }],
              hasImages ? { paddingHorizontal: 4, paddingTop: 4 } : undefined,
              listing ? { paddingHorizontal: 4, paddingTop: 4 } : undefined,
            ]}
          >
            {!isUser && !hasImages && !listing && (
              <Text style={[styles.adminLabel, { color: colors.primary }]}>armauto.am</Text>
            )}
            {hasImages && imageUrls.length === 1 && (
              <Pressable onPress={() => openImageViewer(imageUrls, 0)}>
                <Image source={{ uri: imageUrls[0] }} style={styles.messageImage} contentFit="cover" />
              </Pressable>
            )}
            {hasImages && imageUrls.length > 1 && (
              <View style={styles.messageImageGrid}>
                {imageUrls.slice(0, 4).map((uri, idx) => (
                  <Pressable key={idx} onPress={() => openImageViewer(imageUrls, idx)} style={[
                    styles.messageImageGridItem,
                    imageUrls.length === 2 ? { width: "49%" as any } : { width: "48%" as any },
                  ]}>
                    <Image source={{ uri }} style={styles.messageImageGridImg} contentFit="cover" />
                    {idx === 3 && imageUrls.length > 4 && (
                      <View style={styles.messageImageOverlay}>
                        <Text style={styles.messageImageOverlayText}>+{imageUrls.length - 4}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
            {listing && (
              <View style={[sLC.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                {listing.photo && (
                  <Image source={{ uri: resolveMediaUri(listing.photo) }} style={sLC.image} contentFit="cover" />
                )}
                <View style={sLC.info}>
                  <Text style={[sLC.title, { color: colors.text }]} numberOfLines={1}>
                    {listing.brand} {listing.model} {listing.year}
                  </Text>
                  <Text style={[sLC.price, { color: colors.primary }]}>
                    {formatPrice(listing.price, listing.currency)}
                  </Text>
                  <View style={[sLC.badge, {
                    backgroundColor: listing.status === "rejected" ? colors.statusRejected + "18"
                      : listing.status === "active" ? colors.success + "18"
                      : listing.status === "moderation" ? colors.statusModeration + "18"
                      : colors.textTertiary + "18"
                  }]}>
                    <Text style={[sLC.badgeText, {
                      color: listing.status === "rejected" ? colors.statusRejected
                        : listing.status === "active" ? colors.success
                        : listing.status === "moderation" ? colors.statusModeration
                        : colors.textTertiary
                    }]}>
                      {listing.status === "rejected" ? t("myListings.statusRejected")
                        : listing.status === "active" ? t("myListings.statusActive")
                        : listing.status === "moderation" ? t("myListings.statusModeration")
                        : listing.status}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {hasTextContent && (
              <Text style={[styles.messageText, { color: isUser ? colors.text : colors.text }, hasImages || listing ? { paddingHorizontal: 10, paddingTop: 6 } : undefined]}>
                {item.content}
              </Text>
            )}
            <View style={[styles.messageFooter, (hasImages || listing) && !hasTextContent ? { paddingHorizontal: 10 } : undefined]}>
              <Text style={[styles.messageTime, { color: isUser ? (isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)") : colors.textTertiary }]}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {isUser && (
                <Ionicons
                  name={item.read ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={item.read ? colors.messageReadCheck : (isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)")}
                />
              )}
            </View>
          </View>
        </View>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={[styles.dateSeparatorPill, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}>
              <Text style={[styles.dateSeparatorText, { color: colors.textTertiary }]}>
                {getDateLabel(item.createdAt, t)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        borderBottom
        titleElement={
          <View style={styles.headerCenter}>
            <View style={[styles.headerAvatar, { backgroundColor: isDark ? colors.surfaceTertiary : colors.primary }]}>
              <Ionicons name={I.headset} size={20} color={isDark ? colors.textTertiary : colors.textInverse} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.text }]}>{t("support.title")}</Text>
              {adminTyping ? (
                <Text style={[styles.headerStatus, { color: colors.primary }]}>{t("support.typing")}</Text>
              ) : (
                <Text style={[styles.headerStatus, { color: colors.success }]}>{t("common.online")}</Text>
              )}
            </View>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <View style={[styles.errorCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <Ionicons name={I.alert} size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              <Pressable
                onPress={() => { setLoading(true); fetchMessages(); }}
                style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
              >
                <Ionicons name={I.refresh} size={20} color="#fff" />
                <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
              </Pressable>
            </View>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerContent}>
            <View style={[styles.welcomeCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <View style={[styles.welcomeIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name={I.chatBubble} size={40} color={colors.primary} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t("support.chatTitle")}</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                {t("support.welcomeMessage")}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={invertedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            inverted
            contentContainerStyle={styles.messagesList}
            style={{ backgroundColor: colors.background }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View
          style={[
            styles.inputBarWrapper,
            {
              backgroundColor: isDark ? colors.surface : colors.background,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8),
            },
          ]}
        >
          {attachedListing && (
            <View style={[attachStyles.wrapper, { borderBottomColor: colors.border }]}>
              <View style={[attachStyles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                {attachedListing.photo && (
                  <Image source={{ uri: resolveMediaUri(attachedListing.photo) }} style={attachStyles.thumb} contentFit="cover" />
                )}
                <View style={attachStyles.info}>
                  <Text style={[attachStyles.title, { color: colors.text }]} numberOfLines={1}>
                    {attachedListing.brand} {attachedListing.model} {attachedListing.year}
                  </Text>
                  <Text style={[attachStyles.price, { color: colors.primary }]}>
                    {formatPrice(attachedListing.price, attachedListing.currency)}
                  </Text>
                  <View style={[attachStyles.statusBadge, {
                    backgroundColor: attachedListing.status === "rejected" ? colors.statusRejected + "18"
                      : attachedListing.status === "active" ? colors.success + "18"
                      : attachedListing.status === "moderation" ? colors.statusModeration + "18"
                      : colors.textTertiary + "18"
                  }]}>
                    <Text style={[attachStyles.statusText, {
                      color: attachedListing.status === "rejected" ? colors.statusRejected
                        : attachedListing.status === "active" ? colors.success
                        : attachedListing.status === "moderation" ? colors.statusModeration
                        : colors.textTertiary
                    }]}>
                      {attachedListing.status === "rejected" ? t("myListings.statusRejected")
                        : attachedListing.status === "active" ? t("myListings.statusActive")
                        : attachedListing.status === "moderation" ? t("myListings.statusModeration")
                        : attachedListing.status}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAttachedListing(null); }}
                  style={attachStyles.removeBtn}
                >
                  <Ionicons name={I.closeCircle} size={22} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>
          )}
          {pendingImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow} contentContainerStyle={styles.imagePreviewScroll}>
              {pendingImages.map((img, idx) => (
                <View key={idx} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} contentFit="cover" />
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPendingImages((prev) => prev.filter((_, i) => i !== idx)); }}
                    style={styles.imagePreviewRemove}
                  >
                    <Ionicons name={I.closeCircle} size={22} color="#FF3B30" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          {showAttachPicker && (
            <View style={[styles.attachPickerRow, { borderBottomColor: colors.border }]}>
              <Pressable
                onPress={() => handlePickerOption("camera")}
                style={({ pressed }) => [styles.attachPickerItem, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name={I.camera} size={26} color={colors.text} />
                <Text style={[styles.attachPickerLabel, { color: colors.textSecondary }]}>{t("chat.camera")}</Text>
              </Pressable>
              <Pressable
                onPress={() => handlePickerOption("gallery")}
                style={({ pressed }) => [styles.attachPickerItem, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name={I.images} size={26} color={colors.text} />
                <Text style={[styles.attachPickerLabel, { color: colors.textSecondary }]}>{t("chat.gallery")}</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.inputBar}>
            <Pressable
              onPress={handleAttach}
              style={({ pressed }) => [styles.attachButton, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name={showAttachPicker ? "close" : "add-circle-outline"} size={28} color={colors.primary} />
            </Pressable>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              value={inputText}
              onChangeText={(text) => { setInputText(text); if (text.trim()) sendTypingNotification(); }}
              placeholder={t("support.messagePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={2000}
              editable={!sending}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={(!inputText.trim() && pendingImages.length === 0) || sending}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: (inputText.trim() || pendingImages.length > 0) && !sending ? colors.accentBlue : colors.surfaceSecondary,
                  opacity: pressed && (inputText.trim() || pendingImages.length > 0) ? 0.8 : 1,
                },
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={I.send} size={18} color={(inputText.trim() || pendingImages.length > 0) ? "#FFFFFF" : colors.textTertiary} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={viewerVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerContainer}>
          <Pressable style={styles.viewerCloseBtn} onPress={() => setViewerVisible(false)}>
            <Ionicons name={I.close} size={28} color="#fff" />
          </Pressable>
          {viewerImages.length > 1 && (
            <View style={styles.viewerCounter}>
              <Text style={styles.viewerCounterText}>{viewerIndex + 1} / {viewerImages.length}</Text>
            </View>
          )}
          <FlatList
            data={viewerImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerIndex(idx);
            }}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item: uri }) => (
              <View style={{ width: SCREEN_WIDTH, flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Image source={{ uri }} style={styles.viewerImage} contentFit="contain" />
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, gap: 1 },
  headerName: { fontSize: 17, fontWeight: "600" },
  headerStatus: { fontSize: 12, fontWeight: "500" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  welcomeCard: {
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  welcomeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  welcomeTitle: { fontSize: 20, fontWeight: "700" },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  messagesList: { paddingHorizontal: 12, paddingVertical: 8 },
  messageBubbleRow: { flexDirection: "row", marginVertical: 3, paddingHorizontal: 4, alignItems: "flex-end", gap: 6 },
  sentRow: { justifyContent: "flex-end" },
  receivedRow: { justifyContent: "flex-start" },
  adminAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  messageBubble: { maxWidth: "78%", paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6 },
  sentBubble: { borderRadius: 20, borderBottomRightRadius: 6 },
  receivedBubble: { borderRadius: 20, borderBottomLeftRadius: 6 },
  adminLabel: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 4 },
  messageTime: { fontSize: 11 },
  messageImage: { width: 220, height: 180, borderRadius: 12, marginBottom: 4 },
  messageImageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 4 },
  messageImageGridItem: { aspectRatio: 1, borderRadius: 8, overflow: "hidden" },
  messageImageGridImg: { width: "100%", height: "100%" },
  messageImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  messageImageOverlayText: { color: "#fff", fontSize: 20, fontWeight: "700" as const },
  dateSeparatorContainer: { alignItems: "center", marginVertical: 12 },
  dateSeparatorPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  dateSeparatorText: { fontSize: 12, fontWeight: "500" },
  inputBarWrapper: { borderTopWidth: StyleSheet.hairlineWidth },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 6,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  attachPickerRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 28, borderBottomWidth: StyleSheet.hairlineWidth },
  attachPickerItem: { alignItems: "center", gap: 4 },
  attachPickerLabel: { fontSize: 12, fontWeight: "500" as const },
  imagePreviewRow: { paddingTop: 10 },
  imagePreviewScroll: { paddingHorizontal: 12, gap: 8 },
  imagePreviewContainer: { width: 72, height: 72, borderRadius: 12, overflow: "hidden", position: "relative" as const },
  imagePreview: { width: 72, height: 72 },
  imagePreviewRemove: { position: "absolute" as const, top: -2, right: -2, borderRadius: 11 },
  viewerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  viewerCloseBtn: { position: "absolute" as const, top: 50, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  viewerCounter: { position: "absolute" as const, top: 56, left: 0, right: 0, zIndex: 10, alignItems: "center" },
  viewerCounterText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
  viewerImage: { width: SCREEN_WIDTH, height: "80%" },
  errorCard: { padding: 32, borderRadius: 20, alignItems: "center", gap: 16, width: "100%" },
  errorText: { fontSize: 16, textAlign: "center" },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

const sLC = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  image: {
    width: "100%" as any,
    height: 120,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

const attachStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
  },
  thumb: {
    width: 60,
    height: 60,
  },
  info: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  removeBtn: {
    padding: 8,
  },
});
