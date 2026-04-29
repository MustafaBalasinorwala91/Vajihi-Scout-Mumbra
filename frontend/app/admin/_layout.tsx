import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#5B4FCE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="mark-attendance" options={{ title: 'Mark Attendance' }} />
      <Stack.Screen name="attendance-history" options={{ headerShown: false }} />
      <Stack.Screen name="manage-fees" options={{ title: 'Manage Fees' }} />
      <Stack.Screen name="manage-inventory" options={{ title: 'Manage Inventory' }} />
      <Stack.Screen name="manage-uniforms" options={{ title: 'Manage Uniforms' }} />
      <Stack.Screen name="manage-members" options={{ title: 'Manage Members' }} />
      <Stack.Screen name="assign-tags" options={{ title: 'Assign Tags' }} />
    </Stack>
  );
}
