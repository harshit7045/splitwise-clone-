import { View, ScrollView } from 'react-native';
import { YStack, XStack, Text, Avatar, Circle, Separator } from 'tamagui';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { NeoCard } from '../../components/ui/NeoCard'; // Will create this next
import { Bell, Plus } from 'lucide-react-native';

export default function DashboardScreen() {
    const { user } = useAuth();
    const router = useRouter();

    // Mock data for now until API is live
    const groups = [
        { id: 1, name: 'Goa Trip 2025' },
        { id: 2, name: 'Flat 302' },
        { id: 3, name: 'Office Munchies' },
    ];

    const activities = [
        { id: 101, description: 'Lunch at Cafe', amount: '100.00', paid_by: 'rudra', time: '2h ago' },
        { id: 102, description: 'Uber', amount: '450.00', paid_by: 'alice', time: '5h ago' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', padding: 20, paddingTop: 60 }}>
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <YStack>
                    <Text fontFamily="$heading" fontSize={24} color="$color">Good Morning,</Text>
                    <Text fontFamily="$heading" fontSize={24} color="$primary">{user?.name || 'User'}!</Text>
                </YStack>
                <Circle size={50} backgroundColor="$secondary" elevation={5}>
                    <Text fontFamily="$heading" color="white" fontSize={20}>{user?.username?.[0]?.toUpperCase()}</Text>
                </Circle>
            </XStack>

            {/* Global Balance Card */}
            <YStack backgroundColor="#2B2D31" padding="$4" borderRadius={16} borderWidth={1} borderColor="$borderColor" marginBottom="$6">
                <Text color="$color" opacity={0.6}>Total Balance</Text>
                <Text color="$primary" fontFamily="$heading" fontSize={42}>₹ 1,200.00</Text>
                <Text color="$color" fontSize={12} marginTop="$2">You are owed <Text color="$primary">₹1,500</Text> & owe <Text color="$error">₹300</Text></Text>
            </YStack>

            {/* Squads Rail */}
            <Text fontFamily="$heading" fontSize={18} marginBottom="$3" color="$color">YOUR SQUADS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
                <XStack space="$4">
                    <YStack alignItems="center" space="$2" onPress={() => { }}>
                        <Circle size={70} backgroundColor="$borderColor" borderWidth={2} borderColor="$primary" borderStyle='dashed' justifyContent='center' alignItems='center'>
                            <Plus size={30} color="#D0FF48" />
                        </Circle>
                        <Text fontSize={12} color="$color">New Squad</Text>
                    </YStack>

                    {groups.map((group) => (
                        <YStack key={group.id} alignItems="center" space="$2" onPress={() => router.push(`/group/${group.id}`)}>
                            <Circle size={70} backgroundColor="$secondary" borderWidth={2} borderColor="$color">
                                <Text fontSize={24} top={2}>🏟️</Text>
                            </Circle>
                            <Text fontSize={12} color="$color" maxWidth={70} numberOfLines={1}>{group.name}</Text>
                        </YStack>
                    ))}
                </XStack>
            </ScrollView>

            {/* Recent Activity */}
            <Text fontFamily="$heading" fontSize={18} marginBottom="$3" color="$color">RECENT DROPS</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
                <YStack space="$3">
                    {activities.map((activity) => (
                        <XStack key={activity.id} backgroundColor="#2B2D31" padding="$3" borderRadius={12} alignItems="center" justifyContent="space-between">
                            <XStack space="$3" alignItems="center">
                                <Circle size={40} backgroundColor="$primary" opacity={0.2}><Text>💸</Text></Circle>
                                <YStack>
                                    <Text color="$color" fontWeight="bold">{activity.description}</Text>
                                    <Text color="$color" fontSize={12} opacity={0.6}>{activity.paid_by} added • {activity.time}</Text>
                                </YStack>
                            </XStack>
                            <Text color={activity.paid_by === 'rudra' ? '$primary' : '$error'} fontFamily="$body" fontWeight="bold">
                                {activity.paid_by === 'rudra' ? '+' : '-'} ₹{activity.amount}
                            </Text>
                        </XStack>
                    ))}
                </YStack>
            </ScrollView>
        </View>
    );
}
