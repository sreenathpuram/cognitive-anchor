import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "@/screens/HomeScreen";
import CameraScreen from "@/screens/CameraScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type HomeStackParamList = {
  Home: undefined;
  Camera: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle title="Cognitive Anchor" />,
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Camera")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 8,
              })}
            >
              <Feather name="camera" size={22} color={theme.text} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerTitle: "Camera",
          presentation: "fullScreenModal",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
