import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Today',
                    tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="upload"
                options={{
                    title: 'Add',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="add-circle" size={28} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="medicine-list"
                options={{
                    title: 'Medicines',
                    tabBarIcon: ({ color, size }) => <FontAwesome5 name="pills" size={size - 2} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
