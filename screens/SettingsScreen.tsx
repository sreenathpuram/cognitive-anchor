import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Switch,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { StorageService, AppSettings } from "@/services/storage";

type FontSize = "normal" | "large" | "extra-large";

const FONT_SIZES: { key: FontSize; label: string }[] = [
  { key: "normal", label: "Normal" },
  { key: "large", label: "Large" },
  { key: "extra-large", label: "Extra Large" },
];

export default function SettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    reminderTimes: ["08:00", "12:00", "18:00"],
    voiceEnabled: true,
    highContrastMode: false,
    fontSize: "normal",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await StorageService.getSettings();
    setSettings(loaded);
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await StorageService.saveSettings({ [key]: value });
  };

  const handleClearConversations = () => {
    Alert.alert(
      "Clear Conversations",
      "This will delete all your chat history. Your memories and profile will be kept. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await StorageService.clearConversation();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Done", "Conversation history has been cleared.");
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your data including profile, memories, conversations, and settings. This cannot be undone. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await StorageService.clearAllData();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            Alert.alert("Done", "All data has been cleared.");
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Notifications
        </ThemedText>

        <View
          style={[
            styles.settingRow,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <View style={styles.settingContent}>
            <ThemedText style={styles.settingLabel}>
              Enable Notifications
            </ThemedText>
            <ThemedText
              style={[styles.settingDescription, { color: theme.textSecondary }]}
            >
              Receive reminders and proactive nudges
            </ThemedText>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) => updateSetting("notificationsEnabled", value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Voice
        </ThemedText>

        <View
          style={[
            styles.settingRow,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <View style={styles.settingContent}>
            <ThemedText style={styles.settingLabel}>
              Voice Interaction
            </ThemedText>
            <ThemedText
              style={[styles.settingDescription, { color: theme.textSecondary }]}
            >
              Use voice commands and audio responses
            </ThemedText>
          </View>
          <Switch
            value={settings.voiceEnabled}
            onValueChange={(value) => updateSetting("voiceEnabled", value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Accessibility
        </ThemedText>

        <View
          style={[
            styles.settingRow,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <View style={styles.settingContent}>
            <ThemedText style={styles.settingLabel}>
              High Contrast Mode
            </ThemedText>
            <ThemedText
              style={[styles.settingDescription, { color: theme.textSecondary }]}
            >
              Increase text and UI contrast
            </ThemedText>
          </View>
          <Switch
            value={settings.highContrastMode}
            onValueChange={(value) => updateSetting("highContrastMode", value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <ThemedText
          style={[styles.fieldLabel, { color: theme.textSecondary }]}
        >
          Text Size
        </ThemedText>
        <View style={styles.fontSizeContainer}>
          {FONT_SIZES.map((size) => (
            <Pressable
              key={size.key}
              onPress={() => updateSetting("fontSize", size.key)}
              style={({ pressed }) => [
                styles.fontSizeButton,
                {
                  backgroundColor:
                    settings.fontSize === size.key
                      ? theme.primary
                      : theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.fontSizeButtonText,
                  {
                    color:
                      settings.fontSize === size.key ? "#FFFFFF" : theme.text,
                  },
                ]}
              >
                {size.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Data & Privacy
        </ThemedText>

        <Pressable
          onPress={handleClearConversations}
          style={({ pressed }) => [
            styles.dangerRow,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.dangerIcon,
              { backgroundColor: `${theme.warning}15` },
            ]}
          >
            <Feather name="message-circle" size={20} color={theme.warning} />
          </View>
          <View style={styles.settingContent}>
            <ThemedText style={styles.settingLabel}>
              Clear Conversations
            </ThemedText>
            <ThemedText
              style={[styles.settingDescription, { color: theme.textSecondary }]}
            >
              Delete all chat history
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={handleClearAllData}
          style={({ pressed }) => [
            styles.dangerRow,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={[styles.dangerIcon, { backgroundColor: `${theme.error}15` }]}
          >
            <Feather name="trash-2" size={20} color={theme.error} />
          </View>
          <View style={styles.settingContent}>
            <ThemedText style={[styles.settingLabel, { color: theme.error }]}>
              Clear All Data
            </ThemedText>
            <ThemedText
              style={[styles.settingDescription, { color: theme.textSecondary }]}
            >
              Delete everything permanently
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.aboutSection}>
        <ThemedText
          style={[styles.aboutText, { color: theme.textSecondary }]}
        >
          Cognitive Anchor v1.0.0
        </ThemedText>
        <ThemedText
          style={[styles.aboutText, { color: theme.textSecondary }]}
        >
          Your data is stored locally on your device.
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  fontSizeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  fontSizeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  aboutSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  aboutText: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
});
