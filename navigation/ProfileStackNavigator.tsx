import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import EmergencyContactsScreen from "@/screens/EmergencyContactsScreen";
import CaregiverDashboardScreen from "@/screens/CaregiverDashboardScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EmergencyContacts: undefined;
  CaregiverDashboard: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{
          headerTitle: "Emergency Contacts",
        }}
      />
      <Stack.Screen
        name="CaregiverDashboard"
        component={CaregiverDashboardScreen}
        options={{
          headerTitle: "Caregiver Dashboard",
        }}
      />
    </Stack.Navigator>
  );
}
