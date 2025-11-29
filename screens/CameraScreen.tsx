import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AIService } from "@/services/aiService";
import { VoiceService } from "@/services/voiceService";

export default function CameraScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="camera-off" size={48} color={theme.textSecondary} />
          </View>
          <ThemedText type="h2" style={styles.permissionTitle}>
            Camera Access Needed
          </ThemedText>
          <ThemedText
            style={[styles.permissionText, { color: theme.textSecondary }]}
          >
            To help you recognize people and objects around you, Cognitive
            Anchor needs access to your camera. Your privacy is protected - all
            processing happens securely.
          </ThemedText>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            Enable Camera
          </Button>
        </View>
      </ThemedView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        exif: false,
      });

      if (photo && photo.base64) {
        const result = await AIService.analyzeImage(photo.base64);
        setAnalysisResult(result);
        
        VoiceService.speak(result, () => {
          setIsSpeaking(false);
        });
        setIsSpeaking(true);
      } else {
        setAnalysisResult("I couldn't capture the image. Please try again.");
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      setAnalysisResult("I couldn't capture the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCameraFacing = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const dismissResult = () => {
    VoiceService.stop();
    setIsSpeaking(false);
    setAnalysisResult(null);
  };

  const handleListenAgain = () => {
    if (analysisResult) {
      if (isSpeaking) {
        VoiceService.stop();
        setIsSpeaking(false);
      } else {
        VoiceService.speak(analysisResult, () => {
          setIsSpeaking(false);
        });
        setIsSpeaking(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View
          style={[styles.overlay, { paddingTop: insets.top + Spacing.md }]}
        >
          {analysisResult ? (
            <View
              style={[
                styles.resultCard,
                { backgroundColor: theme.backgroundRoot },
              ]}
            >
              <View style={styles.resultHeader}>
                <Feather name="eye" size={24} color={theme.primary} />
                <ThemedText type="h4" style={styles.resultTitle}>
                  What I See
                </ThemedText>
                <Pressable
                  onPress={handleListenAgain}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.6 : 1,
                    padding: Spacing.xs,
                  })}
                >
                  <Feather
                    name={isSpeaking ? "volume-x" : "volume-2"}
                    size={20}
                    color={theme.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={dismissResult}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.6 : 1,
                    padding: Spacing.xs,
                  })}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.resultScroll}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.resultText}>
                  {analysisResult}
                </ThemedText>
              </ScrollView>
            </View>
          ) : null}

          {!analysisResult ? (
            <View style={styles.hintContainer}>
              <View
                style={[
                  styles.hintCard,
                  { backgroundColor: "rgba(0,0,0,0.6)" },
                ]}
              >
                <Feather name="info" size={18} color="#FFFFFF" />
                <ThemedText style={styles.hintText}>
                  Point your camera at a person, object, or text and tap the
                  button below to identify it
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.controls,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          <Pressable
            onPress={toggleCameraFacing}
            style={({ pressed }) => [
              styles.flipButton,
              {
                backgroundColor: "rgba(0,0,0,0.4)",
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Feather name="refresh-cw" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={isAnalyzing}
            style={({ pressed }) => [
              styles.captureButton,
              {
                opacity: pressed ? 0.8 : 1,
                backgroundColor: isAnalyzing ? theme.textSecondary : "#FFFFFF",
              },
            ]}
          >
            {isAnalyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText
                  style={[styles.analyzingText, { color: theme.primary }]}
                >
                  Analyzing...
                </ThemedText>
              </View>
            ) : (
              <View
                style={[
                  styles.captureButtonInner,
                  { backgroundColor: theme.primary },
                ]}
              />
            )}
          </Pressable>

          <View style={styles.flipButtonPlaceholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  permissionText: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    width: "100%",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  resultCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: 200,
    ...Shadows.large,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  resultTitle: {
    flex: 1,
  },
  resultScroll: {
    maxHeight: 130,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hintContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: Spacing.xl,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  hintText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  flipButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  analyzingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
});
