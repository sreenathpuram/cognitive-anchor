import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  Platform,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { StorageService, Memory } from "@/services/storage";
import type { MemoriesStackParamList } from "@/navigation/MemoriesStackNavigator";

type MemoriesScreenProps = {
  navigation: NativeStackNavigationProp<MemoriesStackParamList, "Memories">;
};

const CATEGORY_ICONS: Record<string, string> = {
  person: "user",
  place: "map-pin",
  event: "calendar",
  routine: "clock",
  other: "file-text",
};

function MemoryCard({
  memory,
  theme,
  onPress,
}: {
  memory: Memory;
  theme: any;
  onPress: () => void;
}) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.memoryCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {memory.imageUri ? (
        <Image
          source={{ uri: memory.imageUri }}
          style={styles.memoryImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.memoryImagePlaceholder,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather
            name={CATEGORY_ICONS[memory.category] as any}
            size={32}
            color={theme.textSecondary}
          />
        </View>
      )}
      <View style={styles.memoryContent}>
        <ThemedText type="h4" numberOfLines={1} style={styles.memoryTitle}>
          {memory.title}
        </ThemedText>
        <ThemedText
          numberOfLines={2}
          style={[styles.memoryDescription, { color: theme.textSecondary }]}
        >
          {memory.content}
        </ThemedText>
        <View style={styles.memoryMeta}>
          <View style={styles.categoryBadge}>
            <Feather
              name={CATEGORY_ICONS[memory.category] as any}
              size={12}
              color={theme.primary}
            />
            <ThemedText
              style={[styles.categoryText, { color: theme.primary }]}
            >
              {memory.category}
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.memoryDate, { color: theme.textSecondary }]}
          >
            {new Date(memory.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

export default function MemoriesScreen({ navigation }: MemoriesScreenProps) {
  const { theme } = useTheme();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMemories();
    }, [])
  );

  const loadMemories = async () => {
    const data = await StorageService.getMemories();
    setMemories(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const renderItem = ({ item, index }: { item: Memory; index: number }) => (
    <View
      style={[
        styles.cardWrapper,
        { marginLeft: index % 2 === 0 ? 0 : Spacing.sm },
      ]}
    >
      <MemoryCard
        memory={item}
        theme={theme}
        onPress={() => navigation.navigate("MemoryDetail", { memoryId: item.id })}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="heart" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No memories yet
      </ThemedText>
      <ThemedText
        style={[styles.emptyDescription, { color: theme.textSecondary }]}
      >
        Tap the + button to add your first memory. Store important people,
        places, and moments here.
      </ThemedText>
      <Pressable
        onPress={() => navigation.navigate("AddMemory")}
        style={({ pressed }) => [
          styles.addButton,
          {
            backgroundColor: theme.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText style={styles.addButtonText}>Add Memory</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ScreenFlatList
      data={memories}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
      contentContainerStyle={
        memories.length === 0 ? styles.emptyContainer : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: "48.5%",
  },
  memoryCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.small,
  },
  memoryImage: {
    width: "100%",
    height: 100,
  },
  memoryImagePlaceholder: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryContent: {
    padding: Spacing.sm,
  },
  memoryTitle: {
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  memoryDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  memoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  memoryDate: {
    fontSize: 11,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
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
    marginBottom: Spacing.xl,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
