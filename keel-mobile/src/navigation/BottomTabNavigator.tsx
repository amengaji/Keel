// keel-mobile/src/navigation/BottomTabNavigator.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import SeaServiceScreen from "../screens/SeaServiceScreen";
import DailyScreen from "../screens/DailyScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

import TasksHomeScreen from "../screens/tasks/TasksHomeScreen";
import TaskSectionScreen from "../screens/tasks/TaskSectionScreen";
import TaskDetailsScreen from "../screens/TaskDetailsScreen";

import { MainStackParamList } from "./types";

const Tab = createBottomTabNavigator();
type TasksStackParamList = {
  TasksHome: undefined;
  TaskSection: {
    sectionKey: string;
    sectionTitle: string;
  };
  TaskDetails: {
    id: number;
  };
};

const TasksStack = createNativeStackNavigator<TasksStackParamList>();

function TasksStackNavigator() {
  return (
    <TasksStack.Navigator screenOptions={{ headerShown: false }}>
      <TasksStack.Screen
        name="TasksHome"
        component={TasksHomeScreen}
      />
      <TasksStack.Screen
        name="TaskSection"
        component={TaskSectionScreen}
      />
      <TasksStack.Screen
        name="TaskDetails"
        component={TaskDetailsScreen}
      />
    </TasksStack.Navigator>
  );
}


/**
 * ============================================================
 * Bottom Tab Navigator
 * ============================================================
 */
export default function BottomTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="SeaService"
        component={SeaServiceScreen}
        options={{
          title: "Sea Service",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="ship-wheel"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ✅ TASKS IS NOW A STACK */}
      <Tab.Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-text"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Daily"
        component={DailyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-check"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cog"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
