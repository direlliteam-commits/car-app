import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Icon } from "@/components/Icon";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useChatMedia } from "@/hooks/useChatMedia";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, apiUploadRequest, fetchLocalBlob } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { resolveMediaUri } from "@/lib/media";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSSEListener } from "@/hooks/useUserSSE";
import { parseImageUrls, formatMessageTime, getDateLabel, areDifferentDays } from "@/lib/chat-utils";
import { useTranslation } from "@/lib/i18n";
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
}

interface SupportTicket {
  id: number;
  subject: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

const supportTicketDrafts = new Map<string, string>();

export default function SupportChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading]);

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState(() => (id ? supportTicketDrafts.get(id) || "" : ""));
  const [error, setError] = useState<string | null>(null);
  const { pendingImages, setPendingImages, showAttachPicker, setShowAttachPicker, handleAttach, handlePickerOption } = useChatMedia();
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;

  useEffect(() => {
    return () => {
      if (id) {
        const draft = inputTextRef.current.trim();
        if (draft) supportTicketDrafts.set(id, draft);
        else supportTicketDrafts.delete(id);
      }
    };
  }, [id]);

  const ticketsQuery = useQuery<any[]>({
    queryKey: [API.support.tickets],
    staleTime: 60000,
  });

  const ticket = ticketsQuery.data?.find((tk: any) => tk.id === parseInt(id || "0"));

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiRequest("GET", API.support.ticketMessages(id!));
      const data: SupportMessage[] = await res.json();
      setMessages(data);
      queryClient.invalidateQueries({ queryKey: [API.support.unreadCount] });
      queryClient.invalidateQueries({ queryKey: [API.support.tickets] });
    } catch (err) {
      setError(t("support.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, queryClient, t]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const fetchMessagesRef = useRef(fetchMessages);
  fetchMessagesRef.current = fetchMessages;

  useSSEListener((event) => {
    const ticketId = parseInt(id || "0");
    if (
      (event.event === "support_message" || event.event === "support_read") &&
      (!event.ticketId || event.ticketId === ticketId)
    ) {
      fetchMessagesRef.current();
    }
    if (event.event === "support_status" && event.ticketId === ticketId) {
      queryClient.invalidateQueries({ queryKey: [API.support.tickets] });
    }
  }, [id, queryClient]);

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
    if (id) formData.append("ticketId", id);
    const res = await apiUploadRequest("POST", API.support.chatSendImage, formData);
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }, [id]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    const hasImages = pendingImages.length > 0;
    if ((!trimmed && !hasImages) || sending || !id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentText = trimmed;
    const currentImages = [...pendingImages];
    setInputText("");
    if (id) supportTicketDrafts.delete(id);
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
      ticketId: parseInt(id),
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

    try {
      if (currentImages.length > 0) {
        await uploadImages(currentImages.map((i) => i.uri), currentText);
      } else {
        await apiRequest("POST", API.support.ticketMessages(id), { content: currentText });
      }
      const res = await apiRequest("GET", API.support.ticketMessages(id!));
      const data: SupportMessage[] = await res.json();
      setMessages(data);
      queryClient.invalidateQueries({ queryKey: [API.support.tickets] });
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(currentText);
      if (currentImages.length > 0) setPendingImages(currentImages);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, [inputText, pendingImages, sending, id, user?.id, queryClient, uploadImages]);

  const isClosed = ticket?.status === "closed";
  const invertedMessages = [...messages].reverse();

  const openImageViewer = useCallback((urls: string[], startIndex: number) => {
    setViewerImages(urls);
    setViewerIndex(startIndex);
    setViewerVisible(true);
  }, []);

  const renderMessage = ({ item, index }: { item: SupportMessage; index: number }) => {
    const isUser = item.senderRole === "user";
    const nextMessage = invertedMessages[index + 1];
    const showDateSeparator = !nextMessage || areDifferentDays(item.createdAt, nextMessage.createdAt);
    const imageUrls = parseImageUrls(item.imageUrl).map((u) => resolveMediaUri(u));
    const hasImages = imageUrls.length > 0;
    const hasTextContent = item.content && !item.content.startsWith("📷");

    return (
      <View>
        <View style={[styles.messageBubbleRow, isUser ? styles.sentRow : styles.receivedRow]}>
          {!isUser && (
            <View style={[styles.adminAvatar, { backgroundColor: isDark ? colors.surfaceTertiary : colors.primary }]}>
              <Icon name="support" size={14} color={isDark ? colors.textTertiary : colors.textInverse} />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isUser
                ? [styles.sentBubble, { backgroundColor: isDark ? (colors.accentBlue + '25') : colors.accentBlueLight }]
                : [styles.receivedBubble, { backgroundColor: isDark ? colors.surface : colors.surface }],
              hasImages ? { paddingHorizontal: 4, paddingTop: 4 } : undefined,
            ]}
          >
            {!isUser && !hasImages && (
              <Text style={[styles.adminLabel, { color: colors.primary }]}>{t("support.title")}</Text>
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
            {hasTextContent && (
              <Text style={[styles.messageText, { color: isUser ? colors.text : colors.text }, hasImages ? { paddingHorizontal: 10, paddingTop: 6 } : undefined]}>
                {item.content}
              </Text>
            )}
            <View style={[styles.messageFooter, hasImages && !hasTextContent ? { paddingHorizontal: 10 } : undefined]}>
              <Text style={[styles.messageTime, { color: isUser ? (isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)") : colors.textTertiary }]}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {isUser && (
                <Icon
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        borderBottom
        titleElement={
          <View style={styles.headerCenter}>
            <View style={[styles.headerAvatar, { backgroundColor: isDark ? colors.surfaceTertiary : colors.primary }]}>
              <Icon name="support" size={18} color={isDark ? colors.textTertiary : colors.textInverse} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
                {t("support.title")}
              </Text>
              <Text style={[styles.headerSubject, { color: colors.textSecondary }]} numberOfLines={1}>
                {ticket?.subject || `${t("support.ticketNumber")} #${id}`}
              </Text>
            </View>
          </View>
        }
        rightElement={ticket ? (
          <View style={[styles.headerStatusBadge, { backgroundColor: (statusColors[ticket.status] || "#999") + "20" }]}>
            <Text style={[styles.headerStatusText, { color: statusColors[ticket.status] || "#999" }]}>
              {ticket.status === "open" ? t("support.statusOpen") : ticket.status === "resolved" ? t("support.statusResolved") : ticket.status === "closed" ? t("support.statusClosed") : ticket.status}
            </Text>
          </View>
        ) : undefined}
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
              <Icon name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              <Pressable
                onPress={() => { setLoading(true); fetchMessages(); }}
                style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
              >
                <Icon name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
              </Pressable>
            </View>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
              {t("support.waitingForResponse")}
            </Text>
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

        {isClosed ? (
          <View style={[styles.closedBar, { backgroundColor: isDark ? colors.surface : colors.background, borderTopColor: colors.border }]}>
            <Icon name="lock-closed" size={16} color={colors.textTertiary} />
            <Text style={[styles.closedText, { color: colors.textSecondary }]}>
              {t("support.ticketClosed")}
            </Text>
          </View>
        ) : (
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
            {pendingImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow} contentContainerStyle={styles.imagePreviewScroll}>
                {pendingImages.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} contentFit="cover" />
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPendingImages((prev) => prev.filter((_, i) => i !== idx)); }}
                      style={styles.imagePreviewRemove}
                    >
                      <Ionicons name={I.closeCircle} size={22} color={colors.statusRejected} />
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
                onChangeText={setInputText}
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
                  <Icon name="send" size={20} color={(inputText.trim() || pendingImages.length > 0) ? "#FFFFFF" : colors.textTertiary} />
                )}
              </Pressable>
            </View>
          </View>
        )}
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

const statusColors: Record<string, string> = {
  open: "#34C759",
  resolved: "#2196F3",
  closed: "#9E9E9E",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, gap: 1 },
  headerName: { fontSize: 16, fontWeight: "600" },
  headerSubject: { fontSize: 12 },
  headerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  headerStatusText: { fontSize: 11, fontWeight: "600" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  messagesList: { paddingHorizontal: 12, paddingVertical: 8 },
  messageBubbleRow: { flexDirection: "row", marginVertical: 3, paddingHorizontal: 4, alignItems: "flex-end", gap: 6 },
  sentRow: { justifyContent: "flex-end" },
  receivedRow: { justifyContent: "flex-start" },
  adminAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  messageBubble: { maxWidth: "78%", paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6 },
  sentBubble: { borderRadius: 20, borderBottomRightRadius: 6 },
  receivedBubble: { borderRadius: 20, borderBottomLeftRadius: 6 },
  adminLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 4 },
  messageTime: { fontSize: 11 },
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
  attachButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
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
  messageImage: { width: 220, height: 180, borderRadius: 12, marginBottom: 4 },
  messageImageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 4 },
  messageImageGridItem: { aspectRatio: 1, borderRadius: 8, overflow: "hidden" },
  messageImageGridImg: { width: "100%", height: "100%" },
  messageImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  messageImageOverlayText: { color: "#fff", fontSize: 20, fontWeight: "700" as const },
  viewerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  viewerCloseBtn: { position: "absolute" as const, top: 50, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  viewerCounter: { position: "absolute" as const, top: 56, left: 0, right: 0, zIndex: 10, alignItems: "center" },
  viewerCounterText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
  viewerImage: { width: SCREEN_WIDTH, height: "80%" },
  closedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  closedText: { fontSize: 14, fontWeight: "500" },
  emptyChatText: { fontSize: 15, textAlign: "center" },
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
