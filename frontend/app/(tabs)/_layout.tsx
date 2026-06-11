import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5B4FCE',
        tabBarInactiveTintColor: '#999',
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingVertical: 4,
        },

        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e8e8e8',

          height: 65 + insets.bottom,

          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,

          elevation: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
        },

        headerStyle: {
          backgroundColor: '#5B4FCE',
        },
        headerShadowVisible: false,

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