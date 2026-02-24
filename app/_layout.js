import { Stack } from 'expo-router';
import { MedicineProvider } from '../context/MedicineContext';

export default function RootLayout() {
  return (
    <MedicineProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Login', headerBackTitle: 'Back' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Register', headerBackTitle: 'Back' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </MedicineProvider>
  );
}
