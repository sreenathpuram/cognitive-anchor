import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import MemoriesScreen from "@/screens/MemoriesScreen";
import MemoryDetailScreen from "@/screens/MemoryDetailScreen";
import AddMemoryScreen from "@/screens/AddMemoryScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type MemoriesStackParamList = {
  Memories: undefined;
  MemoryDetail: { memoryId: string };
  AddMemory: undefined;
};

const Stack = createNativeStackNavigator<MemoriesStackParamList>();

export default function MemoriesStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Memories"
        component={MemoriesScreen}
        options={({ navigation }) => ({
          headerTitle: "Memories",
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("AddMemory")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 8,
              })}
            >
              <Feather name="plus-circle" size={22} color={theme.text} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="MemoryDetail"
        component={MemoryDetailScreen}
        options={{
          headerTitle: "Memory",
        }}
      />
      <Stack.Screen
        name="AddMemory"
        component={AddMemoryScreen}
        options={{
          headerTitle: "Add Memory",
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
