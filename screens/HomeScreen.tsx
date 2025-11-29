import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { StorageService, Message, generateId } from "@/services/storage";
import { AIService } from "@/services/aiService";
import { VoiceService } from "@/services/voiceService";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MessageBubble({
  message,
  theme,
  onListen,
  isPlaying,
}: {
  message: Message;
  theme: any;
  onListen: () => void;
  isPlaying: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.messageBubble,
        isUser ? styles.userMessage : styles.aiMessage,
        {
          backgroundColor: isUser ? theme.messageUser : theme.messageAI,
          borderColor: isUser ? "transparent" : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.messageText,
          { color: isUser ? "#FFFFFF" : theme.text },
        ]}
      >
        {message.content}
      </ThemedText>
      <View style={styles.messageFooter}>
        {!isUser ? (
          <Pressable
            onPress={onListen}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 4,
            })}
          >
            <Feather
              name={isPlaying ? "volume-x" : "volume-2"}
              size={16}
              color={theme.primary}
            />
          </Pressable>
        ) : null}
        <ThemedText
          style={[
            styles.messageTime,
            { color: isUser ? "rgba(255,255,255,0.7)" : theme.textSecondary },
          ]}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

function ContextCard({
  message,
  theme,
  onDismiss,
  onListen,
}: {
  message: string;
  theme: any;
  onDismiss: () => void;
  onListen: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.contextCard,
        { backgroundColor: `${theme.info}15`, borderColor: theme.info },
      ]}
    >
      <View style={styles.contextCardContent}>
        <Feather name="bell" size={24} color={theme.info} />
        <ThemedText style={styles.contextCardText}>{message}</ThemedText>
      </View>
      <View style={styles.contextCardActions}>
        <Pressable
          onPress={onListen}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: Spacing.xs,
          })}
        >
          <Feather name="volume-2" size={18} color={theme.info} />
        </Pressable>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: Spacing.xs,
          })}
        >
          <Feather name="x" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function VoiceRecordingModal({
  visible,
  theme,
  onClose,
  onTextInput,
}: {
  visible: boolean;
  theme: any;
  onClose: () => void;
  onTextInput: (text: string) => void;
}) {
  const pulseScale = useSharedValue(1);
  const [voiceText, setVoiceText] = useState("");

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleSubmit = () => {
    if (voiceText.trim()) {
      onTextInput(voiceText.trim());
      setVoiceText("");
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.voiceModal, { borderColor: theme.border }]}>
          <ThemedText type="h3" style={styles.voiceModalTitle}>
            Voice Input
          </ThemedText>

          <Animated.View
            style={[
              styles.voicePulse,
              { backgroundColor: `${theme.primary}20` },
              pulseStyle,
            ]}
          >
            <View
              style={[
                styles.voiceIconContainer,
                { backgroundColor: theme.primary },
              ]}
            >
              <Feather name="mic" size={32} color="#FFFFFF" />
            </View>
          </Animated.View>

          <ThemedText
            style={[styles.voiceHint, { color: theme.textSecondary }]}
          >
            Voice recognition works best in the Expo Go app on your device.
            {"\n"}For now, type your message below:
          </ThemedText>

          <TextInput
            style={[
              styles.voiceTextInput,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={voiceText}
            onChangeText={setVoiceText}
            placeholder="Type what you want to say..."
            placeholderTextColor={theme.textSecondary}
            multiline
          />

          <View style={styles.voiceModalButtons}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.voiceModalButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.voiceModalButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText style={{ color: "#FFFFFF" }}>Send</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextNudge, setContextNudge] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isLifeStoryMode, setIsLifeStoryMode] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sendScale = useSharedValue(1);

  useEffect(() => {
    loadConversation();
    checkForNudge();
  }, []);

  const loadConversation = async () => {
    const conversation = await StorageService.getConversation();
    if (conversation) {
      setMessages(conversation.messages);
    }
  };

  const checkForNudge = async () => {
    const nudge = await AIService.generateProactiveNudge();
    if (nudge) {
      setContextNudge(nudge);
      VoiceService.speak(nudge);
    }
  };

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessageWithContent = async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);
    scrollToEnd();

    await StorageService.addMessage(userMessage);

    try {
      const response = await AIService.sendMessage(content, updatedMessages);

      const aiMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await StorageService.addMessage(aiMessage);
      scrollToEnd();

      VoiceService.speak(response, () => {
        setPlayingMessageId(null);
      });
      setPlayingMessageId(aiMessage.id);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await sendMessageWithContent(inputText);
  };

  const handleVoicePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowVoiceModal(true);
  };

  const handleVoiceTextInput = (text: string) => {
    sendMessageWithContent(text);
  };

  const handleListenToMessage = (message: Message) => {
    if (playingMessageId === message.id) {
      VoiceService.stop();
      setPlayingMessageId(null);
    } else {
      VoiceService.stop();
      VoiceService.speak(message.content, () => {
        setPlayingMessageId(null);
      });
      setPlayingMessageId(message.id);
    }
  };

  const handleListenToNudge = () => {
    if (contextNudge) {
      VoiceService.speak(contextNudge);
    }
  };

  const handleStartLifeStory = async () => {
    if (isLoading) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    setIsLifeStoryMode(true);

    try {
      const response = await AIService.startLifeStorySession(messages);

      const aiMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await StorageService.addMessage(aiMessage);
      scrollToEnd();

      VoiceService.speak(response, () => {
        setPlayingMessageId(null);
      });
      setPlayingMessageId(aiMessage.id);
    } catch (error) {
      console.error("Error starting life story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSendPressIn = () => {
    sendScale.value = withSpring(0.9);
  };

  const handleSendPressOut = () => {
    sendScale.value = withSpring(1);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      theme={theme}
      onListen={() => handleListenToMessage(item)}
      isPlaying={playingMessageId === item.id}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="message-circle" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        Welcome to Cognitive Anchor
      </ThemedText>
      <ThemedText
        style={[styles.emptyDescription, { color: theme.textSecondary }]}
      >
        I'm here to help you remember and stay connected. Start a conversation
        or ask me anything!
      </ThemedText>

      <Pressable
        onPress={handleStartLifeStory}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.lifeStoryButton,
          {
            backgroundColor: theme.secondary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="book-open" size={20} color="#FFFFFF" />
        <ThemedText style={styles.lifeStoryButtonText}>
          Start Life Story Session
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {contextNudge ? (
        <View style={[styles.contextCardWrapper, { top: paddingTop }]}>
          <ContextCard
            message={contextNudge}
            theme={theme}
            onDismiss={() => setContextNudge(null)}
            onListen={handleListenToNudge}
          />
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageList,
          {
            paddingTop: paddingTop + (contextNudge ? 80 : 0),
            paddingBottom: paddingBottom + 80,
          },
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
      />

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: paddingBottom,
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundRoot,
              web: theme.backgroundRoot,
            }),
          },
        ]}
      >
        {Platform.OS === "ios" ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.backgroundRoot, opacity: 0.95 },
            ]}
          />
        ) : null}
        <View style={styles.inputRow}>
          <Pressable
            onPress={handleVoicePress}
            style={({ pressed }) => [
              styles.voiceButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="mic" size={24} color="#FFFFFF" />
          </Pressable>

          <View
            style={[
              styles.textInputContainer,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>

          <AnimatedPressable
            onPress={handleSend}
            onPressIn={handleSendPressIn}
            onPressOut={handleSendPressOut}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !isLoading
                    ? theme.primary
                    : theme.backgroundSecondary,
              },
              sendButtonStyle,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather
                name="send"
                size={20}
                color={inputText.trim() ? "#FFFFFF" : theme.textSecondary}
              />
            )}
          </AnimatedPressable>
        </View>
      </View>

      <VoiceRecordingModal
        visible={showVoiceModal}
        theme={theme}
        onClose={() => setShowVoiceModal(false)}
        onTextInput={handleVoiceTextInput}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.sm + 4,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    borderWidth: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: Spacing.xs,
  },
  aiMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  messageTime: {
    fontSize: 11,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.medium,
  },
  textInputContainer: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.small,
  },
  contextCardWrapper: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    ...Shadows.medium,
  },
  contextCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  contextCardText: {
    flex: 1,
    fontSize: 15,
  },
  contextCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  lifeStoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  lifeStoryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  voiceModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.large,
  },
  voiceModalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  voicePulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  voiceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceHint: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  voiceTextInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
  },
  voiceModalButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  voiceModalButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
});
