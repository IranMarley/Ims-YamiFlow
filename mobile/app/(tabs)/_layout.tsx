import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../lib/theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ focused, name, focusedName }: { focused: boolean; name: IconName; focusedName: IconName }) {
  return (
    <Ionicons
      name={focused ? focusedName : name}
      size={24}
      color={focused ? colors.primary : colors.subtle}
    />
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home-outline" focusedName="home" />
          ),
          headerTitle: 'YamiFlow',
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarLabel: 'Courses',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="library-outline" focusedName="library" />
          ),
          headerTitle: 'Courses',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="my-learning"
        options={{
          title: 'My Learning',
          tabBarLabel: 'Learning',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="book-outline" focusedName="book" />
          ),
          headerTitle: 'My Learning',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person-outline" focusedName="person" />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  )
}
