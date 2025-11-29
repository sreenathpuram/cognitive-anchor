import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Image,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { StorageService, Memory } from "@/services/storage";
import type { MemoriesStackParamList } from "@/navigation/MemoriesStackNavigator";

type MemoryDetailScreenProps = {
  navigation: NativeStackNavigationProp<MemoriesStackParamList, "MemoryDetail">;
  route: RouteProp<MemoriesStackParamList, "MemoryDetail">;
};

const CATEGORY_ICONS: Record<string, string> = {
  person: "user",
  place: "map-pin",
  event: "calendar",
  routine: "clock",
  other: "file-text",
};

export default function MemoryDetailScreen({
  navigation,
  route,
}: MemoryDetailScreenProps) {
  const { theme } = useTheme();
  const { memoryId } = route.params;
  const [memory, setMemory] = useState<Memory | null>(null);

  useEffect(() => {
    loadMemory();
  }, [memoryId]);

  const loadMemory = async () => {
    const memories = await StorageService.getMemories();
    const found = memories.find((m) => m.id === memoryId);
    setMemory(found || null);
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      "Delete Memory",
      "Are you sure you want to delete this memory? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await StorageService.deleteMemory(memoryId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!memory) {
    return (
      <ScreenScrollView contentContainerStyle={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      {memory.imageUri ? (
        <Image
          source={{ uri: memory.imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather
            name={CATEGORY_ICONS[memory.category] as any}
            size={64}
            color={theme.textSecondary}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Feather
              name={CATEGORY_ICONS[memory.category] as any}
              size={16}
              color={theme.primary}
            />
            <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
              {memory.category}
            </ThemedText>
          </View>
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {new Date(memory.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
        </View>

        <ThemedText type="h1" style={styles.title}>
          {memory.title}
        </ThemedText>

        <ThemedText style={styles.contentText}>{memory.content}</ThemedText>

        {memory.tags.length > 0 ? (
          <View style={styles.tagsContainer}>
            <ThemedText
              type="small"
              style={[styles.tagsLabel, { color: theme.textSecondary }]}
            >
              Tags
            </ThemedText>
            <View style={styles.tags}>
              {memory.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <ThemedText style={styles.tagText}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                backgroundColor: `${theme.error}15`,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="trash-2" size={20} color={theme.error} />
            <ThemedText style={[styles.deleteButtonText, { color: theme.error }]}>
              Delete Memory
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  date: {
    fontSize: 13,
  },
  title: {
    marginBottom: Spacing.md,
  },
  contentText: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  tagsContainer: {
    marginBottom: Spacing.xl,
  },
  tagsLabel: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 14,
  },
  actions: {
    marginTop: Spacing.lg,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
