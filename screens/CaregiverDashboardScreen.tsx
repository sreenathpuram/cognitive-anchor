import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  StorageService,
  UserProfile,
  EmergencyContact,
  Memory,
  Message,
} from "@/services/storage";

interface ActivityStats {
  messagesTotal: number;
  memoriesTotal: number;
  lastActive: string | null;
  todayMessages: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
  theme,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function AlertCard({
  type,
  message,
  time,
  theme,
}: {
  type: "info" | "warning" | "success";
  message: string;
  time: string;
  theme: any;
}) {
  const colors = {
    info: theme.info,
    warning: theme.warning,
    success: theme.success,
  };
  const icons = {
    info: "bell",
    warning: "alert-triangle",
    success: "check-circle",
  };

  return (
    <View
      style={[
        styles.alertCard,
        { backgroundColor: `${colors[type]}10`, borderColor: colors[type] },
      ]}
    >
      <Feather name={icons[type] as any} size={20} color={colors[type]} />
      <View style={styles.alertContent}>
        <ThemedText style={styles.alertMessage}>{message}</ThemedText>
        <ThemedText style={[styles.alertTime, { color: theme.textSecondary }]}>
          {time}
        </ThemedText>
      </View>
    </View>
  );
}

function ContactQuickAction({
  contact,
  theme,
  onCall,
}: {
  contact: EmergencyContact;
  theme: any;
  onCall: () => void;
}) {
  return (
    <View
      style={[
        styles.contactCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={styles.contactInfo}>
        <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
        <ThemedText
          style={[styles.contactRelationship, { color: theme.textSecondary }]}
        >
          {contact.relationship}
        </ThemedText>
      </View>
      <Pressable
        onPress={onCall}
        style={({ pressed }) => [
          styles.callButton,
          {
            backgroundColor: theme.success,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="phone" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function CaregiverDashboardScreen() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    messagesTotal: 0,
    memoriesTotal: 0,
    lastActive: null,
    todayMessages: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    const [userProfile, emergencyContacts, memories, conversation] =
      await Promise.all([
        StorageService.getUserProfile(),
        StorageService.getEmergencyContacts(),
        StorageService.getMemories(),
        StorageService.getConversation(),
      ]);

    setProfile(userProfile);
    setContacts(emergencyContacts);
    setRecentMemories(memories.slice(0, 3));

    const messages = conversation?.messages || [];
    const today = new Date().toDateString();
    const todayMessages = messages.filter(
      (m) => new Date(m.timestamp).toDateString() === today
    );
    const lastMessage = messages[messages.length - 1];

    setStats({
      messagesTotal: messages.length,
      memoriesTotal: memories.length,
      lastActive: lastMessage?.timestamp || null,
      todayMessages: todayMessages.length,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCall = async (contact: EmergencyContact) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const phoneUrl = `tel:${contact.phone}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
    } else {
      Alert.alert(
        "Cannot Call",
        "Phone calls are not supported on this device."
      );
    }
  };

  const formatLastActive = (timestamp: string | null) => {
    if (!timestamp) return "No activity yet";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const generateAlerts = () => {
    const alerts: Array<{
      type: "info" | "warning" | "success";
      message: string;
      time: string;
    }> = [];

    if (stats.todayMessages > 0) {
      alerts.push({
        type: "success",
        message: `${stats.todayMessages} conversations today`,
        time: "Today",
      });
    }

    if (stats.lastActive) {
      const lastActiveDate = new Date(stats.lastActive);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        alerts.push({
          type: "warning",
          message: "No activity in the last 24 hours",
          time: formatLastActive(stats.lastActive),
        });
      }
    }

    if (contacts.length === 0) {
      alerts.push({
        type: "info",
        message: "No emergency contacts added yet",
        time: "Action needed",
      });
    }

    if (recentMemories.length > 0) {
      const latestMemory = recentMemories[0];
      alerts.push({
        type: "info",
        message: `Latest memory: "${latestMemory.title}"`,
        time: new Date(latestMemory.createdAt).toLocaleDateString(),
      });
    }

    return alerts;
  };

  const alerts = generateAlerts();

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="h2">Caregiver Dashboard</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {profile?.name
              ? `Monitoring ${profile.name}`
              : "Activity Overview"}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                stats.todayMessages > 0
                  ? `${theme.success}20`
                  : `${theme.warning}20`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  stats.todayMessages > 0 ? theme.success : theme.warning,
              },
            ]}
          />
          <ThemedText
            style={[
              styles.statusText,
              {
                color:
                  stats.todayMessages > 0 ? theme.success : theme.warning,
              },
            ]}
          >
            {stats.todayMessages > 0 ? "Active" : "Inactive"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="message-circle"
          label="Messages"
          value={stats.messagesTotal}
          color={theme.primary}
          theme={theme}
        />
        <StatCard
          icon="heart"
          label="Memories"
          value={stats.memoriesTotal}
          color={theme.secondary}
          theme={theme}
        />
        <StatCard
          icon="clock"
          label="Last Active"
          value={formatLastActive(stats.lastActive)}
          color={theme.info}
          theme={theme}
        />
        <StatCard
          icon="activity"
          label="Today"
          value={`${stats.todayMessages} msgs`}
          color={theme.success}
          theme={theme}
        />
      </View>

      {alerts.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Alerts & Updates
          </ThemedText>
          {alerts.map((alert, index) => (
            <AlertCard
              key={index}
              type={alert.type}
              message={alert.message}
              time={alert.time}
              theme={theme}
            />
          ))}
        </View>
      ) : null}

      {contacts.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Quick Contacts
          </ThemedText>
          {contacts.slice(0, 3).map((contact) => (
            <ContactQuickAction
              key={contact.id}
              contact={contact}
              theme={theme}
              onCall={() => handleCall(contact)}
            />
          ))}
        </View>
      ) : null}

      {recentMemories.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Recent Memories
          </ThemedText>
          {recentMemories.map((memory) => (
            <View
              key={memory.id}
              style={[
                styles.memoryCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.memoryCategoryIcon,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <Feather
                  name={
                    memory.category === "person"
                      ? "user"
                      : memory.category === "place"
                        ? "map-pin"
                        : memory.category === "event"
                          ? "calendar"
                          : "file-text"
                  }
                  size={16}
                  color={theme.primary}
                />
              </View>
              <View style={styles.memoryContent}>
                <ThemedText style={styles.memoryTitle} numberOfLines={1}>
                  {memory.title}
                </ThemedText>
                <ThemedText
                  style={[styles.memoryDescription, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {memory.content}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <ThemedText
          style={[styles.footerText, { color: theme.textSecondary }]}
        >
          Last updated: {new Date().toLocaleTimeString()}
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.small,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: "500",
  },
  alertTime: {
    fontSize: 12,
    marginTop: 2,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactRelationship: {
    fontSize: 13,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  memoryCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryContent: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  memoryDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: 12,
  },
});
