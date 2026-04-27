import { Stack } from 'expo-router'
import { colors } from '../../../lib/theme'
import BackButton from '../../../components/ui/BackButton'

const HeaderLeft = () => <BackButton />

export default function CoursesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackVisible: false,
        headerLeft: HeaderLeft,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Courses', headerLeft: () => null }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  )
}
