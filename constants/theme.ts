import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#212121",
    textSecondary: "#757575",
    textDisabled: "#BDBDBD",
    buttonText: "#FFFFFF",
    tabIconDefault: "#757575",
    tabIconSelected: "#4A90E2",
    link: "#4A90E2",
    primary: "#4A90E2",
    secondary: "#7CB342",
    accent: "#FFA726",
    backgroundRoot: "#F8F9FA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F2F2F7",
    backgroundTertiary: "#E5E5EA",
    border: "#E0E0E0",
    success: "#66BB6A",
    warning: "#FFA726",
    error: "#EF5350",
    info: "#42A5F5",
    inputBackground: "#FFFFFF",
    cardBackground: "#FFFFFF",
    messageUser: "#4A90E2",
    messageAI: "#FFFFFF",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textDisabled: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#4A90E2",
    link: "#4A90E2",
    primary: "#4A90E2",
    secondary: "#7CB342",
    accent: "#FFA726",
    backgroundRoot: "#1C1C1E",
    backgroundDefault: "#2C2C2E",
    backgroundSecondary: "#3A3A3C",
    backgroundTertiary: "#48484A",
    border: "#38383A",
    success: "#66BB6A",
    warning: "#FFA726",
    error: "#EF5350",
    info: "#42A5F5",
    inputBackground: "#2C2C2E",
    cardBackground: "#2C2C2E",
    messageUser: "#4A90E2",
    messageAI: "#2C2C2E",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  inputHeight: 56,
  buttonHeight: 56,
  iconButtonSize: 48,
  voiceButtonSize: 64,
  avatarSize: 120,
  cardPadding: 16,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 9999,
};

export const Typography = {
  hero: {
    fontSize: 36,
    fontWeight: "700" as const,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
