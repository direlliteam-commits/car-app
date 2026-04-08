import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Animated as RNAnimated } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, apiUploadRequest, fetchLocalBlob } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSSEListener } from "@/hooks/useUserSSE";
import { useChatMedia } from "@/hooks/useChatMedia";
import { useTranslation } from "@/lib/i18n";
import * as Haptics from "expo-haptics";

export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  imageUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface ConvUser {
  id: string;
  username: string;
  name: string | null;
  phone?: string | null;
  avatarUrl: string | null;
  verified: boolean;
  lastLoginAt: string | null;
}

export interface ConvListing {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: "USD" | "AMD" | "EUR" | "RUB";
  status?: string;
  images: string[];
}

export interface ConversationInfo {
  id: number;
  buyerId: string;
  sellerId: string;
  listingId: number | null;
  otherUser?: ConvUser;
  listing?: ConvListing;
}

const PAGE_SIZE = 40;

const chatDrafts = new Map<string, string>();

export function formatLastSeen(dateStr: string | null | undefined, t: (key: string) => string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("chat.online");
  if (diffMin < 60) return t("chat.wasOnlineMinAgo").replace("{min}", String(diffMin));
  if (diffHours < 24) return t("chat.wasOnlineHoursAgo").replace("{hours}", String(diffHours));
  if (diffDays === 1) return t("chat.wasOnlineYesterday");
  if (diffDays < 7) return t("chat.wasOnlineDaysAgo").replace("{days}", String(diffDays));
  const day = date.getDate();
  const monthKey = `time.month${date.getMonth() + 1}` as string;
  const formattedDate = `${day} ${t(monthKey)}`;
  return t("chat.wasOnlineDate").replace("{date}", formattedDate);
}

export function useChatDetail(id: string | undefined) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const chatMedia = useChatMedia();
  const { pendingImages, setPendingImages, showAttachPicker, setShowAttachPicker } = chatMedia;

  const getStatusLabel = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      sold: t("messages.statusSold"),
      archived: t("messages.statusArchived"),
      deleted: t("messages.statusDeleted"),
      moderation: t("messages.statusModeration"),
      rejected: t("messages.statusRejected"),
    };
    return statusMap[status] || status;
  }, [t]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState(() => (id ? chatDrafts.get(id) || "" : ""));
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuSlideAnim = useRef(new RNAnimated.Value(300)).current;
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const systemMsgAnim = useRef(new RNAnimated.Value(0)).current;
  const systemMsgShown = useRef(false);
  const totalRef = useRef<number>(0);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;
  const [vinSharing, setVinSharing] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (id) {
        const draft = inputTextRef.current.trim();
        if (draft) chatDrafts.set(id, draft);
        else chatDrafts.delete(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (showMenu) {
      menuSlideAnim.setValue(300);
      RNAnimated.spring(menuSlideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    }
  }, [showMenu]);

  const convQuery = useQuery<ConversationInfo>({
    queryKey: [API.conversations.getById(id!)],
    enabled: isAuthenticated && !!id,
    staleTime: 60000,
  });

  const convInfo = convQuery.data;
  const otherUser = convInfo?.otherUser;
  const listing = convInfo?.listing;

  const fetchMessages = useCallback(async (offset = 0, append = false) => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiRequest("GET", `${API.conversations.messages(id)}?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      const msgs: Message[] = data.messages || data;
      const total = data.total ?? msgs.length;
      totalRef.current = total;

      if (append) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = msgs.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
      } else {
        const reversed = [...msgs].reverse();
        setMessages(reversed);
      }
      setHasMore(offset + msgs.length < total);
      queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
      queryClient.invalidateQueries({ queryKey: [API.unreadCount] });
    } catch (err: unknown) {
      setError(t("chat.loadError"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, queryClient]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchMessages(0, false);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, id, fetchMessages]);

  const pollNewRef = useRef<() => void>(() => {});
  pollNewRef.current = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiRequest("GET", `${API.conversations.messages(id)}?limit=${PAGE_SIZE}&offset=0`);
      const data = await res.json();
      const msgs: Message[] = (data.messages || data).reverse();
      setMessages((prev) => {
        if (prev.length === 0) return msgs;
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = msgs.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) {
          return prev.map((pm) => {
            const updated = msgs.find((m) => m.id === pm.id);
            return updated && updated.read !== pm.read ? { ...pm, read: updated.read } : pm;
          });
        }
        return [...newMsgs, ...prev];
      });
    } catch (e) { console.warn("Poll new messages failed:", e); }
  }, [id]);

  useSSEListener((event) => {
    const convId = parseInt(id || "0");
    if (event.event === "new_message" && event.conversationId === convId) {
      pollNewRef.current();
    }
    if (event.event === "conversation_read" && event.conversationId === convId) {
      pollNewRef.current();
    }
  }, [id]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const currentLength = messagesRef.current.length;
    const offset = totalRef.current - currentLength - PAGE_SIZE;
    const safeOffset = Math.max(0, offset);
    const limit = Math.min(PAGE_SIZE, totalRef.current - currentLength);
    if (limit <= 0) {
      setLoadingMore(false);
      setHasMore(false);
      return;
    }

    try {
      const res = await apiRequest("GET", `${API.conversations.messages(id!)}?limit=${limit}&offset=${safeOffset}`);
      const data = await res.json();
      const msgs: Message[] = data.messages || data;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = msgs.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMsgs];
      });
      setHasMore(msgs.length >= PAGE_SIZE);
    } catch (e) { console.warn('Load more messages failed:', e); } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, id]);

  const sendTypingEvent = useCallback(() => {
    if (!id) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    apiRequest("POST", API.conversations.typing(id)).catch((e: unknown) => console.warn('Typing event failed:', e));
  }, [id]);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if (text.trim().length > 0) sendTypingEvent();
  }, [sendTypingEvent]);

  useSSEListener((event) => {
    if (event.event === "typing_indicator" && event.conversationId === Number(id)) {
      setOtherTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setOtherTyping(false), 4000);
    }
    if (event.event === "typing_stop" && event.conversationId === Number(id)) {
      setOtherTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  }, [id]);

  const uploadImages = useCallback(async (imageUris: string[], content: string): Promise<Message> => {
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
    const res = await apiUploadRequest("POST", API.conversations.sendImage(id!), formData);
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
    if (id) chatDrafts.delete(id);
    setPendingImages([]);
    setSending(true);
    setShowAttachPicker(false);

    const photoLabel = currentImages.length > 1 ? `📷 ${t("chat.photosCount").replace("{count}", String(currentImages.length))}` : `📷 ${t("chat.photoLabel")}`;
    const optimisticImageUrl = currentImages.length === 1
      ? currentImages[0].uri
      : currentImages.length > 1
        ? JSON.stringify(currentImages.map((i) => i.uri))
        : null;

    const optimisticMessage: Message = {
      id: Date.now(),
      conversationId: parseInt(id),
      senderId: user?.id || "",
      content: currentText || (hasImages ? photoLabel : ""),
      imageUrl: optimisticImageUrl,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [optimisticMessage, ...prev]);

    try {
      let serverMsg: Message;
      if (currentImages.length > 0) {
        serverMsg = await uploadImages(currentImages.map((i) => i.uri), currentText);
      } else {
        const res = await apiRequest("POST", API.conversations.messages(id), { content: currentText });
        serverMsg = await res.json();
      }
      setMessages((prev) => prev.map((m) => m.id === optimisticMessage.id ? serverMsg : m));
      queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setInputText(currentText);
      if (currentImages.length > 0) setPendingImages(currentImages);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, [inputText, pendingImages, sending, id, user?.id, uploadImages]);

  const openImageViewer = useCallback((urls: string[], startIndex: number) => {
    setViewerImages(urls);
    setViewerIndex(startIndex);
    setViewerVisible(true);
  }, []);

  const isFirstMessage = useCallback((index: number) => {
    return index === messages.length - 1;
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0 && !systemMsgShown.current) {
      systemMsgShown.current = true;
      const timer = setTimeout(() => {
        RNAnimated.timing(systemMsgAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [messages.length, systemMsgAnim]);

  const handleShareVin = useCallback(async () => {
    if (!id || vinSharing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVinSharing(Date.now());
    try {
      const res = await apiRequest("POST", API.conversations.shareVin(id));
      if (res.status === 400) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      const serverMsg: Message = await res.json();
      setMessages((prev) => [serverMsg, ...prev]);
      queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setVinSharing(null);
    }
  }, [id, vinSharing, queryClient]);

  const isSeller = convInfo?.sellerId === user?.id;
  const vinAlreadyShared = messages.some((m) => m.content?.startsWith("[VIN_SHARE:"));

  return {
    isAuthenticated,
    user,
    t,
    queryClient,
    convInfo,
    otherUser,
    listing,
    messages,
    loading,
    sending,
    inputText,
    error,
    otherTyping,
    hasMore,
    loadingMore,
    viewerImages,
    viewerIndex,
    viewerVisible,
    showMenu,
    showReportModal,
    menuSlideAnim,
    confirmDialog,
    systemMsgAnim,
    vinSharing,
    isSeller,
    vinAlreadyShared,
    chatMedia,
    getStatusLabel,
    setMessages,
    setLoading,
    setInputText,
    setViewerImages,
    setViewerIndex,
    setViewerVisible,
    setShowMenu,
    setShowReportModal,
    setConfirmDialog,
    fetchMessages,
    loadMore,
    handleTextChange,
    handleSend,
    openImageViewer,
    isFirstMessage,
    handleShareVin,
  };
}
