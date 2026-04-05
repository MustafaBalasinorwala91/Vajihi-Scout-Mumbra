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
      <Stack.Screen name="manage-fees" options={{ title: 'Manage Fees' }} />
      <Stack.Screen name="manage-inventory" options={{ title: 'Manage Inventory' }} />
      <Stack.Screen name="assign-tags" options={{ title: 'Assign Tags' }} />
    </Stack>
  );
}
