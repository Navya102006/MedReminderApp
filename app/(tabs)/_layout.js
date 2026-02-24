import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="upload"
                options={{
                    title: 'Upload',
                    tabBarIcon: ({ color }) => <FontAwesome name="plus-circle" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="medicine-list"
                options={{
                    title: 'Medicines',
                    tabBarIcon: ({ color }) => <FontAwesome name="list-ul" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
