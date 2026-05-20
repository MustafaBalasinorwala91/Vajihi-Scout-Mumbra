import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5B4FCE',
        tabBarInactiveTintColor: '#999',

        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',

          height: 97,
          paddingBottom: 18,
          paddingTop: 20,

          position: 'absolute',
        },

        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 5,
        },

        headerStyle: {
          backgroundColor: '#5B4FCE',
        },

        headerTintColor: '#fff',

        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >

      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          headerShown: false,
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="fees"
        options={{
          headerShown: false,
          title: 'Fees',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          headerShown: false,
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="musical-notes"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="uniforms"
        options={{
          headerShown: false,
          title: 'Uniforms',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}