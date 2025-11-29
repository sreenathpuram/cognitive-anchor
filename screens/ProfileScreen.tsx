import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Image,
  Alert,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { StorageService, UserProfile, generateId } from "@/services/storage";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, "Profile">;
};

type AvatarPreset = "tree" | "flower" | "sun";

const AVATAR_PRESETS: { key: AvatarPreset; source: any }[] = [
  { key: "tree", source: require("../assets/images/avatars/avatar-tree.png") },
  { key: "flower", source: require("../assets/images/avatars/avatar-flower.png") },
  { key: "sun", source: require("../assets/images/avatars/avatar-sun.png") },
];

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarPreset, setAvatarPreset] = useState<AvatarPreset | null>("tree");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await StorageService.getUserProfile();
    if (profile) {
      setName(profile.name);
      setAvatarUri(profile.avatarUri || null);
      setAvatarPreset(profile.avatarPreset || null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarPreset(null);
    }
  };

  const selectPreset = (preset: AvatarPreset) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setAvatarPreset(preset);
    setAvatarUri(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your name.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSaving(true);

    const existingProfile = await StorageService.getUserProfile();
    const profile: UserProfile = {
      id: existingProfile?.id || generateId(),
      name: name.trim(),
      avatarUri: avatarUri || undefined,
      avatarPreset: avatarPreset || undefined,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await StorageService.saveUserProfile(profile);

    setIsSaving(false);

    if (success) {
      Alert.alert("Saved", "Your profile has been updated.");
    } else {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    }
  };

  const getAvatarSource = () => {
    if (avatarUri) {
      return { uri: avatarUri };
    }
    if (avatarPreset) {
      const preset = AVATAR_PRESETS.find((p) => p.key === avatarPreset);
      return preset?.source;
    }
    return AVATAR_PRESETS[0].source;
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.inputBackground,
      borderColor: theme.border,
      color: theme.text,
    },
  ];

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Image source={getAvatarSource()} style={styles.avatar} />
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [
              styles.editAvatarButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="camera" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        <ThemedText
          style={[styles.avatarHint, { color: theme.textSecondary }]}
        >
          Choose a preset or upload your photo
        </ThemedText>

        <View style={styles.presetContainer}>
          {AVATAR_PRESETS.map((preset) => (
            <Pressable
              key={preset.key}
              onPress={() => selectPreset(preset.key)}
              style={({ pressed }) => [
                styles.presetButton,
                {
                  borderColor:
                    avatarPreset === preset.key && !avatarUri
                      ? theme.primary
                      : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Image source={preset.source} style={styles.presetImage} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Your Name
        </ThemedText>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={theme.textDisabled}
          autoCapitalize="words"
        />
      </View>

      <Button onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
        {isSaving ? "Saving..." : "Save Profile"}
      </Button>

      <View style={styles.menuSection}>
        <ThemedText type="h4" style={styles.menuTitle}>
          Quick Actions
        </ThemedText>

        <Pressable
          onPress={() => navigation.navigate("EmergencyContacts")}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={[styles.menuIconContainer, { backgroundColor: `${theme.error}15` }]}
          >
            <Feather name="phone" size={20} color={theme.error} />
          </View>
          <View style={styles.menuItemContent}>
            <ThemedText style={styles.menuItemTitle}>
              Emergency Contacts
            </ThemedText>
            <ThemedText
              style={[styles.menuItemDescription, { color: theme.textSecondary }]}
            >
              Manage your emergency contacts
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("CaregiverDashboard")}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.menuIconContainer,
              { backgroundColor: `${theme.secondary}15` },
            ]}
          >
            <Feather name="users" size={20} color={theme.secondary} />
          </View>
          <View style={styles.menuItemContent}>
            <ThemedText style={styles.menuItemTitle}>Caregiver Dashboard</ThemedText>
            <ThemedText
              style={[styles.menuItemDescription, { color: theme.textSecondary }]}
            >
              Activity summary and alerts
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Settings")}
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.menuIconContainer,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Feather name="settings" size={20} color={theme.primary} />
          </View>
          <View style={styles.menuItemContent}>
            <ThemedText style={styles.menuItemTitle}>Settings</ThemedText>
            <ThemedText
              style={[styles.menuItemDescription, { color: theme.textSecondary }]}
            >
              Notifications, privacy, and more
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.small,
  },
  avatarHint: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  presetContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  presetButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
  },
  presetImage: {
    width: "100%",
    height: "100%",
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  saveButton: {
    marginBottom: Spacing.xxl,
  },
  menuSection: {
    marginBottom: Spacing.xl,
  },
  menuTitle: {
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 13,
  },
});
