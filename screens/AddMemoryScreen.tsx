import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Image,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { StorageService, Memory, generateId } from "@/services/storage";
import type { MemoriesStackParamList } from "@/navigation/MemoriesStackNavigator";

type AddMemoryScreenProps = {
  navigation: NativeStackNavigationProp<MemoriesStackParamList, "AddMemory">;
};

type MemoryCategory = "person" | "place" | "event" | "routine" | "other";

const CATEGORIES: { key: MemoryCategory; label: string; icon: string }[] = [
  { key: "person", label: "Person", icon: "user" },
  { key: "place", label: "Place", icon: "map-pin" },
  { key: "event", label: "Event", icon: "calendar" },
  { key: "routine", label: "Routine", icon: "clock" },
  { key: "other", label: "Other", icon: "file-text" },
];

export default function AddMemoryScreen({ navigation }: AddMemoryScreenProps) {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("person");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Needed",
        "Please allow camera access to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for this memory.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSaving(true);

    const memory: Memory = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      imageUri: imageUri || undefined,
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await StorageService.saveMemory(memory);

    setIsSaving(false);

    if (success) {
      navigation.goBack();
    } else {
      Alert.alert("Error", "Failed to save memory. Please try again.");
    }
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
      <View style={styles.imageSection}>
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <Pressable
              onPress={() => setImageUri(null)}
              style={[
                styles.removeImageButton,
                { backgroundColor: theme.error },
              ]}
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.imageButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="camera" size={24} color={theme.primary} />
              <ThemedText style={[styles.imageButtonText, { color: theme.primary }]}>
                Take Photo
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [
                styles.imageButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="image" size={24} color={theme.primary} />
              <ThemedText style={[styles.imageButtonText, { color: theme.primary }]}>
                Choose Photo
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Title *
        </ThemedText>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., My daughter Sarah"
          placeholderTextColor={theme.textDisabled}
          maxLength={100}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Category
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
                setCategory(cat.key);
              }}
              style={({ pressed }) => [
                styles.categoryButton,
                {
                  backgroundColor:
                    category === cat.key
                      ? theme.primary
                      : theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather
                name={cat.icon as any}
                size={18}
                color={category === cat.key ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.categoryButtonText,
                  { color: category === cat.key ? "#FFFFFF" : theme.text },
                ]}
              >
                {cat.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Description
        </ThemedText>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Add details about this memory..."
          placeholderTextColor={theme.textDisabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={2000}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Tags (comma separated)
        </ThemedText>
        <TextInput
          style={inputStyle}
          value={tags}
          onChangeText={setTags}
          placeholder="e.g., family, birthday, favorite"
          placeholderTextColor={theme.textDisabled}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Memory"}
        </Button>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    marginBottom: Spacing.lg,
  },
  imageButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  imageButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
  textArea: {
    height: 120,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  categoryScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
