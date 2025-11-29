import * as Speech from "expo-speech";
import { Platform, Alert } from "react-native";

export interface VoiceSettings {
  rate: number;
  pitch: number;
  language: string;
}

const defaultSettings: VoiceSettings = {
  rate: 0.85,
  pitch: 1.0,
  language: "en-US",
};

let currentSettings = { ...defaultSettings };
let isSpeaking = false;

export const VoiceService = {
  async speak(text: string, onDone?: () => void): Promise<void> {
    if (Platform.OS === "web") {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = currentSettings.rate;
        utterance.pitch = currentSettings.pitch;
        utterance.lang = currentSettings.language;
        utterance.onend = () => {
          isSpeaking = false;
          onDone?.();
        };
        isSpeaking = true;
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    try {
      isSpeaking = true;
      await Speech.speak(text, {
        rate: currentSettings.rate,
        pitch: currentSettings.pitch,
        language: currentSettings.language,
        onDone: () => {
          isSpeaking = false;
          onDone?.();
        },
        onError: () => {
          isSpeaking = false;
        },
      });
    } catch (error) {
      console.error("Speech error:", error);
      isSpeaking = false;
    }
  },

  async stop(): Promise<void> {
    if (Platform.OS === "web") {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeaking = false;
      return;
    }

    try {
      await Speech.stop();
      isSpeaking = false;
    } catch (error) {
      console.error("Stop speech error:", error);
    }
  },

  isSpeaking(): boolean {
    return isSpeaking;
  },

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    if (Platform.OS === "web") {
      return [];
    }
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch {
      return [];
    }
  },

  updateSettings(settings: Partial<VoiceSettings>): void {
    currentSettings = { ...currentSettings, ...settings };
  },

  getSettings(): VoiceSettings {
    return { ...currentSettings };
  },

  showVoiceInputMessage(): void {
    Alert.alert(
      "Voice Input",
      "Voice input works best on the Expo Go app on your phone. Tap the microphone button and speak clearly.\n\nFor this demo, please type your message instead.",
      [{ text: "OK" }]
    );
  },
};
