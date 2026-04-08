import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Modal,
  Dimensions,
  Animated as RNAnimated,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Icon } from "@/components/Icon";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";
import { OVERLAY_BG, SHEET_BORDER_RADIUS } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { UserReportModal } from "@/components/UserReportModal";
import { useChatDetail } from "@/hooks/useChatDetail";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { API } from "@/lib/api-endpoints";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const chat = useChatDetail(id);
  const {
    isAuthenticated, user, t, queryClient,
    otherUser, listing, messages,
    loading, sending, inputText, error,
    otherTyping, loadingMore,
    viewerImages, viewerIndex, viewerVisible,
    showMenu, showReportModal, menuSlideAnim,
    confirmDialog, systemMsgAnim,
    vinSharing, isSeller, vinAlreadyShared,
    chatMedia,
    getStatusLabel,
    setLoading, setViewerIndex, setViewerVisible,
    setShowMenu, setShowReportModal, setConfirmDialog,
    fetchMessages, loadMore,
    handleTextChange, handleSend,
    openImageViewer, isFirstMessage, handleShareVin,
  } = chat;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader title={t("chat.chatTitle")} borderBottom />
        <View style={styles.centerContent}>
          <View style={[styles.guestCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <View style={[styles.guestIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <Icon name="chatbubble" size={48} color={colors.textTertiary} />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>{t("chat.loginRequired")}</Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              {t("chat.loginRequiredMessage")}
            </Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/auth"); }}
              style={({ pressed }) => [styles.loginButton, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
            >
              <Icon name="log-in" size={22} color="#fff" />
              <Text style={styles.loginButtonText}>{t("chat.loginButton")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const otherName = otherUser?.name || otherUser?.username || otherUser?.phone || t("chat.interlocutor");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ChatHeader
        colors={colors}
        isDark={isDark}
        t={t}
        otherUser={otherUser}
        otherName={otherName}
        otherTyping={otherTyping}
        listing={listing}
        getStatusLabel={getStatusLabel}
        setShowMenu={setShowMenu}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ChatMessageList
          messages={messages}
          userId={user?.id}
          colors={colors}
          isDark={isDark}
          t={t}
          otherTyping={otherTyping}
          loadingMore={loadingMore}
          loading={loading}
          error={error}
          listing={listing}
          isSeller={isSeller}
          vinAlreadyShared={vinAlreadyShared}
          vinSharing={vinSharing}
          systemMsgAnim={systemMsgAnim}
          isFirstMessage={isFirstMessage}
          openImageViewer={openImageViewer}
          handleShareVin={handleShareVin}
          loadMore={loadMore}
          fetchMessages={fetchMessages}
          setLoading={setLoading}
        />

        <ChatInputBar
          colors={colors}
          isDark={isDark}
          t={t}
          inputText={inputText}
          sending={sending}
          insets={insets}
          pendingImages={chatMedia.pendingImages}
          showAttachPicker={chatMedia.showAttachPicker}
          handleTextChange={handleTextChange}
          handleSend={handleSend}
          handleAttach={chatMedia.handleAttach}
          handlePickerOption={chatMedia.handlePickerOption}
          setPendingImages={chatMedia.setPendingImages}
        />
      </KeyboardAvoidingView>

      <Modal visible={showMenu} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <RNAnimated.View style={[styles.menuSheet, { backgroundColor: isDark ? colors.surfaceTertiary : isDark ? colors.surface : colors.background, transform: [{ translateY: menuSlideAnim }] }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuSheetHandle}>
              <View style={[styles.menuSheetHandleBar, { backgroundColor: colors.textTertiary }]} />
            </View>
            <Pressable
              onPress={() => {
                setShowMenu(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeout(() => setShowReportModal(true), 300);
              }}
              style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? colors.surfacePressed : "transparent" }]}
            >
              <Ionicons name={I.warning} size={22} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t("chat.report")}</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => {
                setShowMenu(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setConfirmDialog({
                  title: t("chat.blockUser"),
                  message: t("chat.blockConfirmMessage").replace("{name}", otherName),
                  confirmText: t("chat.blockUser"),
                  onConfirm: () => {
                    if (otherUser) {
                      apiRequest("POST", API.users.block(otherUser.id)).then(() => {
                        queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
                        if (router.canGoBack()) router.back();
                      }).catch(() => {});
                    }
                  },
                });
              }}
              style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? colors.surfacePressed : "transparent" }]}
            >
              <Ionicons name={I.ban} size={22} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t("chat.blockUser")}</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => {
                setShowMenu(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setConfirmDialog({
                  title: t("chat.deleteDialogTitle"),
                  message: t("chat.deleteDialogMessage"),
                  confirmText: t("common.delete"),
                  onConfirm: () => {
                    apiRequest("DELETE", API.conversations.getById(id)).then(() => {
                      queryClient.invalidateQueries({ queryKey: [API.conversations.list] });
                      if (router.canGoBack()) router.back();
                    }).catch(() => {});
                  },
                });
              }}
              style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? colors.surfacePressed : "transparent" }]}
            >
              <Ionicons name={I.delete} size={22} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t("chat.deleteChat")}</Text>
            </Pressable>
            </Pressable>
          </RNAnimated.View>
        </Pressable>
      </Modal>

      <Modal visible={!!confirmDialog} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setConfirmDialog(null)}>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: isDark ? colors.surfaceTertiary : isDark ? colors.surface : colors.background }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>{confirmDialog?.title}</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{confirmDialog?.message}</Text>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => setConfirmDialog(null)}
                style={({ pressed }) => [styles.confirmBtn, styles.confirmBtnCancel, { backgroundColor: colors.surfacePressed, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.confirmBtnText, { color: colors.text }]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => { confirmDialog?.onConfirm(); setConfirmDialog(null); }}
                style={({ pressed }) => [styles.confirmBtn, styles.confirmBtnAction, { backgroundColor: colors.error, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.confirmBtnText, { color: colors.textInverse }]}>{confirmDialog?.confirmText}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {otherUser && (
        <UserReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetUserId={otherUser.id}
          colors={colors}
        />
      )}

      <Modal visible={viewerVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerContainer}>
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
          <View style={styles.viewerOverlay} pointerEvents="box-none">
            <Pressable style={styles.viewerCloseBtn} onPress={() => setViewerVisible(false)} hitSlop={12}>
              <Ionicons name={I.close} size={28} color="#fff" />
            </Pressable>
            {viewerImages.length > 1 && (
              <View style={styles.viewerCounter}>
                <Text style={styles.viewerCounterText}>{viewerIndex + 1} / {viewerImages.length}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  menuOverlay: { flex: 1, backgroundColor: OVERLAY_BG, justifyContent: "flex-end" },
  menuSheet: { borderTopLeftRadius: SHEET_BORDER_RADIUS, borderTopRightRadius: SHEET_BORDER_RADIUS, paddingBottom: 34 },
  menuSheetHandle: { alignItems: "center", paddingVertical: 10 },
  menuSheetHandleBar: { width: 36, height: 4, borderRadius: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, gap: 14 },
  menuItemText: { fontSize: 16, fontWeight: "400" as const },
  menuDivider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
  confirmOverlay: { flex: 1, backgroundColor: OVERLAY_BG, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  confirmCard: { width: "100%", borderRadius: 16, padding: 24, alignItems: "center" as const, gap: 12 },
  confirmTitle: { fontSize: 18, fontWeight: "600" as const, textAlign: "center" as const },
  confirmMessage: { fontSize: 14, lineHeight: 20, textAlign: "center" as const },
  confirmButtons: { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" as const, justifyContent: "center" as const },
  confirmBtnCancel: {},
  confirmBtnAction: {},
  confirmBtnText: { fontSize: 15, fontWeight: "600" as const },
  guestCard: { padding: 32, borderRadius: 20, alignItems: "center", gap: 16, width: "100%" },
  guestIconContainer: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  guestTitle: { fontSize: 22, fontWeight: "600" as const },
  guestSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
  loginButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 10, width: "100%", marginTop: 8 },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
  viewerContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  viewerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  viewerCloseBtn: { position: "absolute" as const, top: 50, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  viewerCounter: { position: "absolute" as const, top: 56, left: 0, right: 0, zIndex: 10, alignItems: "center" },
  viewerCounterText: { color: "#fff", fontSize: 16, fontWeight: "600" as const },
  viewerImage: { width: SCREEN_WIDTH, height: "80%" },
});
