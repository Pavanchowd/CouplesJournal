 

import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <Tabs
  screenOptions={{
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarStyle: {
      backgroundColor: 'white',   // 👈 makes tab bar white
      borderTopWidth: 0,          // optional: remove border line
      elevation: 0,               // optional: remove shadow on Android
    },
  }}
>
      <Tabs.Screen
  name="index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home" size={size} color={color} />
    ),
  }}
/>
 <Tabs.Screen
  name="journel"
  options={{
    title: 'Journel',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="book" size={size} color={color} />
    ),
  }}
/>
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="globe" color={color} />,
        }}
      />
      <Tabs.Screen
        name="spaces"
        options={{
          title: 'Spaces',
          tabBarIcon: () =>( <Ionicons size={28} name="people" color="grey" />),
        }}
      />
        <Tabs.Screen
        name="together"
        options={{
          title: 'Together',
          tabBarIcon: () =>( <Ionicons size={28} name="heart" color="grey" />),
        }}
      />
       
    </Tabs>
    </SafeAreaProvider>
     
  );
}