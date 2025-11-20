import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.tint,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
