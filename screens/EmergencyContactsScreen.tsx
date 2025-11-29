import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { StorageService, EmergencyContact, generateId } from "@/services/storage";

function ContactCard({
  contact,
  theme,
  onCall,
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
  theme: any;
  onCall: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={[
        styles.contactCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: contact.isPrimary ? theme.primary : theme.border,
          borderWidth: contact.isPrimary ? 2 : 1,
        },
      ]}
    >
      <View style={styles.contactHeader}>
        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
            {contact.isPrimary ? (
              <View
                style={[
                  styles.primaryBadge,
                  { backgroundColor: `${theme.primary}15` },
                ]}
              >
                <ThemedText
                  style={[styles.primaryBadgeText, { color: theme.primary }]}
                >
                  Primary
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText
            style={[styles.contactRelationship, { color: theme.textSecondary }]}
          >
            {contact.relationship}
          </ThemedText>
          <ThemedText style={[styles.contactPhone, { color: theme.primary }]}>
            {contact.phone}
          </ThemedText>
        </View>

        <View style={styles.contactActions}>
          <Pressable
            onPress={onCall}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.success,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="phone" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.contactFooter}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: Spacing.xs,
          })}
        >
          <ThemedText style={[styles.footerAction, { color: theme.primary }]}>
            Edit
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: Spacing.xs,
          })}
        >
          <ThemedText style={[styles.footerAction, { color: theme.error }]}>
            Delete
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export default function EmergencyContactsScreen() {
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null
  );
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    const data = await StorageService.getEmergencyContacts();
    setContacts(data);
  };

  const resetForm = () => {
    setName("");
    setRelationship("");
    setPhone("");
    setIsPrimary(false);
    setEditingContact(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setIsPrimary(contact.isPrimary);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing Information", "Please enter name and phone number.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const contact: EmergencyContact = {
      id: editingContact?.id || generateId(),
      name: name.trim(),
      relationship: relationship.trim() || "Contact",
      phone: phone.trim(),
      isPrimary,
    };

    if (isPrimary) {
      const existingContacts = await StorageService.getEmergencyContacts();
      for (const c of existingContacts) {
        if (c.id !== contact.id && c.isPrimary) {
          await StorageService.saveEmergencyContact({ ...c, isPrimary: false });
        }
      }
    }

    await StorageService.saveEmergencyContact(contact);
    await loadContacts();
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to remove ${contact.name} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await StorageService.deleteEmergencyContact(contact.id);
            await loadContacts();
          },
        },
      ]
    );
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
      Alert.alert("Cannot Call", "Phone calls are not supported on this device.");
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
    <ScreenScrollView>
      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="phone" size={48} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.emptyTitle}>
            No Emergency Contacts
          </ThemedText>
          <ThemedText
            style={[styles.emptyDescription, { color: theme.textSecondary }]}
          >
            Add trusted contacts who can be reached quickly in case of an
            emergency.
          </ThemedText>
          <Button onPress={openAddModal} style={styles.addButton}>
            Add Contact
          </Button>
        </View>
      ) : (
        <>
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              theme={theme}
              onCall={() => handleCall(contact)}
              onEdit={() => openEditModal(contact)}
              onDelete={() => handleDelete(contact)}
            />
          ))}

          <Button onPress={openAddModal} style={styles.addMoreButton}>
            Add Another Contact
          </Button>
        </>
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">
                {editingContact ? "Edit Contact" : "Add Contact"}
              </ThemedText>
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: Spacing.xs,
                })}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.field}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  Name *
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Sarah (Daughter)"
                  placeholderTextColor={theme.textDisabled}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  Relationship
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  value={relationship}
                  onChangeText={setRelationship}
                  placeholder="e.g., Daughter, Doctor, Caregiver"
                  placeholderTextColor={theme.textDisabled}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  Phone Number *
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g., +1 555-123-4567"
                  placeholderTextColor={theme.textDisabled}
                  keyboardType="phone-pad"
                />
              </View>

              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  setIsPrimary(!isPrimary);
                }}
                style={[
                  styles.checkboxRow,
                  {
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isPrimary
                        ? theme.primary
                        : "transparent",
                      borderColor: isPrimary ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {isPrimary ? (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
                <ThemedText style={styles.checkboxLabel}>
                  Set as primary contact
                </ThemedText>
              </Pressable>

              <Button onPress={handleSave} style={styles.saveButton}>
                {editingContact ? "Save Changes" : "Add Contact"}
              </Button>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
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
    paddingHorizontal: Spacing.lg,
  },
  addButton: {
    minWidth: 200,
  },
  contactCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
  },
  primaryBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  contactRelationship: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  contactPhone: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactActions: {
    justifyContent: "center",
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.small,
  },
  contactFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  footerAction: {
    fontSize: 14,
    fontWeight: "500",
  },
  addMoreButton: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.md,
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
