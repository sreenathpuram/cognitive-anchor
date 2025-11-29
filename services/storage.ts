import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER_PROFILE: "@cognitive_anchor_user_profile",
  MEMORIES: "@cognitive_anchor_memories",
  CONVERSATIONS: "@cognitive_anchor_conversations",
  EMERGENCY_CONTACTS: "@cognitive_anchor_emergency_contacts",
  SETTINGS: "@cognitive_anchor_settings",
};

export interface UserProfile {
  id: string;
  name: string;
  avatarUri?: string;
  avatarPreset?: "tree" | "flower" | "sun";
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  imageUri?: string;
  category: "person" | "place" | "event" | "routine" | "other";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isContextual?: boolean;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderTimes: string[];
  voiceEnabled: boolean;
  highContrastMode: boolean;
  fontSize: "normal" | "large" | "extra-large";
}

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  reminderTimes: ["08:00", "12:00", "18:00"],
  voiceEnabled: true,
  highContrastMode: false,
  fontSize: "normal",
};

export const StorageService = {
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      return true;
    } catch (error) {
      console.error("Error saving user profile:", error);
      return false;
    }
  },

  async getMemories(): Promise<Memory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting memories:", error);
      return [];
    }
  },

  async saveMemory(memory: Memory): Promise<boolean> {
    try {
      const memories = await this.getMemories();
      const existingIndex = memories.findIndex((m) => m.id === memory.id);
      if (existingIndex >= 0) {
        memories[existingIndex] = memory;
      } else {
        memories.unshift(memory);
      }
      await AsyncStorage.setItem(
        STORAGE_KEYS.MEMORIES,
        JSON.stringify(memories)
      );
      return true;
    } catch (error) {
      console.error("Error saving memory:", error);
      return false;
    }
  },

  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const memories = await this.getMemories();
      const filtered = memories.filter((m) => m.id !== memoryId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.MEMORIES,
        JSON.stringify(filtered)
      );
      return true;
    } catch (error) {
      console.error("Error deleting memory:", error);
      return false;
    }
  },

  async getConversation(): Promise<Conversation | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting conversation:", error);
      return null;
    }
  },

  async saveConversation(conversation: Conversation): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS,
        JSON.stringify(conversation)
      );
      return true;
    } catch (error) {
      console.error("Error saving conversation:", error);
      return false;
    }
  },

  async addMessage(message: Message): Promise<boolean> {
    try {
      let conversation = await this.getConversation();
      if (!conversation) {
        conversation = {
          id: generateId(),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
      return await this.saveConversation(conversation);
    } catch (error) {
      console.error("Error adding message:", error);
      return false;
    }
  },

  async clearConversation(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      return true;
    } catch (error) {
      console.error("Error clearing conversation:", error);
      return false;
    }
  },

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting emergency contacts:", error);
      return [];
    }
  },

  async saveEmergencyContact(contact: EmergencyContact): Promise<boolean> {
    try {
      const contacts = await this.getEmergencyContacts();
      const existingIndex = contacts.findIndex((c) => c.id === contact.id);
      if (existingIndex >= 0) {
        contacts[existingIndex] = contact;
      } else {
        contacts.push(contact);
      }
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        JSON.stringify(contacts)
      );
      return true;
    } catch (error) {
      console.error("Error saving emergency contact:", error);
      return false;
    }
  },

  async deleteEmergencyContact(contactId: string): Promise<boolean> {
    try {
      const contacts = await this.getEmergencyContacts();
      const filtered = contacts.filter((c) => c.id !== contactId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        JSON.stringify(filtered)
      );
      return true;
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      return false;
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (error) {
      console.error("Error getting settings:", error);
      return defaultSettings;
    }
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(updated)
      );
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  },

  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      return true;
    } catch (error) {
      console.error("Error clearing all data:", error);
      return false;
    }
  },
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
