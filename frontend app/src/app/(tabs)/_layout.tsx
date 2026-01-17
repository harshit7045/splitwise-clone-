import { Tabs } from 'expo-router';
import { Home, Users, User } from 'lucide-react-native';
import { useTheme } from 'tamagui';

export default function TabLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1E1E1E',
                    borderTopColor: '#36393F',
                    height: 60,
                    paddingBottom: 10
                },
                tabBarActiveTintColor: '#D0FF48', // Primary Acid Green
                tabBarInactiveTintColor: '#888',
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} />,
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color }) => <Users color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User color={color} />,
                }}
            />
        </Tabs>
    );
}
