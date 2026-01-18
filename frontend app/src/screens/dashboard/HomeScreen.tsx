import { View, ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Circle } from 'tamagui';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { formatCurrency } from '../../utils/format';

export default function DashboardScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => (await client.get('/expenses/groups')).data
    });

    const { data: balance, refetch: refetchBalance } = useQuery({
        queryKey: ['globalBalance'],
        queryFn: async () => (await client.get('/expenses/global-balance')).data
    });

    const { data: activities = [], refetch: refetchActivities } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => (await client.get('/expenses/activity')).data
    });

    const onRefresh = React.useCallback(() => {
        refetchGroups();
        refetchBalance();
        refetchActivities();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', padding: 20, paddingTop: 60 }}>
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <YStack>
                    <Text fontFamily="$heading" fontSize={24} color="$color">Good Morning,</Text>
                    <Text fontFamily="$heading" fontSize={24} color="$primary">{user?.name}</Text>
                </YStack>
                <Circle size={40} backgroundColor="$secondary" onPress={() => router.push('/(tabs)/profile')}>
                    <Text fontSize={20}>👤</Text>
                </Circle>
            </XStack>

            <ScrollView
                refreshControl={<RefreshControl refreshing={groupsLoading} onRefresh={onRefresh} tintColor="#D0FF48" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Global Balance Card */}
                <YStack backgroundColor="#2B2D31" borderRadius={16} padding="$5" marginBottom="$6">
                    <Text color="$color" opacity={0.7} marginBottom="$2">Total Balance</Text>
                    <Text fontFamily="$heading" fontSize={36} color={balance?.totalBalance >= 0 ? '#D0FF48' : '#FF6B6B'}>
                        {formatCurrency(balance?.totalBalance || 0)}
                    </Text>
                    <XStack marginTop="$4" space="$4">
                        <YStack flex={1} backgroundColor="#1E1E1E" padding="$3" borderRadius={8} alignItems="center">
                            <Text color="#D0FF48" fontSize={12} fontWeight="bold">You obey</Text>
                            <Text color="$color" fontSize={16}>{formatCurrency(balance?.totalOwed || 0)}</Text>
                        </YStack>
                        <YStack flex={1} backgroundColor="#1E1E1E" padding="$3" borderRadius={8} alignItems="center">
                            <Text color="#FF6B6B" fontSize={12} fontWeight="bold">You owe</Text>
                            <Text color="$color" fontSize={16}>{formatCurrency(Math.abs(balance?.totalOwes || 0))}</Text>
                        </YStack>
                    </XStack>
                </YStack>

                {/* Squads Rail */}
                <Text fontFamily="$heading" fontSize={18} marginBottom="$3" color="$color">YOUR SQUADS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
                    <XStack space="$4">
                        {/* CREATE BUTTON */}
                        <YStack alignItems="center" space="$2" onPress={() => router.push('/groups/create')}>
                            <Circle size={70} backgroundColor="$borderColor" borderWidth={2} borderColor="$primary" borderStyle='dashed' justifyContent='center' alignItems='center'>
                                <Plus size={30} color="#D0FF48" />
                            </Circle>
                            <Text fontSize={12} color="$color">New Squad</Text>
                        </YStack>

                        {/* JOIN BUTTON (NEW) */}
                        <YStack alignItems="center" space="$2" onPress={() => router.push('/groups/join')}>
                            <Circle size={70} backgroundColor="#2B2D31" borderWidth={2} borderColor="$color" justifyContent='center' alignItems='center'>
                                <Text fontSize={24}>🔗</Text>
                            </Circle>
                            <Text fontSize={12} color="$color">Join Squad</Text>
                        </YStack>

                        {groups?.map((group: any) => (
                            <YStack key={group.id} alignItems="center" space="$2" onPress={() => router.push(`/group/${group.id}`)}>
                                <Circle size={70} backgroundColor="$secondary" borderWidth={2} borderColor="$color">
                                    <Text fontSize={24} top={2}>🏟️</Text>
                                </Circle>
                                <Text fontSize={12} color="$color" maxWidth={70} numberOfLines={1}>{group.name}</Text>
                            </YStack>
                        ))}
                    </XStack>
                </ScrollView>

                {/* Recent Activity (REAL DATA) */}
                <Text fontFamily="$heading" fontSize={18} marginBottom="$3" color="$color">RECENT DROPS</Text>
                <YStack space="$3" paddingBottom="$10">
                    {activities.length === 0 ? (
                        <Text color="$color" opacity={0.5}>No expenses yet.</Text>
                    ) : (
                        activities.map((activity: any) => (
                            <XStack key={activity.id} backgroundColor="#2B2D31" padding="$3" borderRadius={12} alignItems="center" justifyContent="space-between">
                                <XStack space="$3" alignItems="center">
                                    <Circle size={40} backgroundColor="$primary" opacity={0.2}><Text>💸</Text></Circle>
                                    <YStack>
                                        <Text color="$color" fontWeight="bold">{activity.description}</Text>
                                        <Text color="$color" fontSize={12} opacity={0.6}>
                                            {activity.paid_by_name} paid • {new Date(activity.created_at).toLocaleDateString()}
                                        </Text>
                                    </YStack>
                                </XStack>
                                <Text color="$primary" fontFamily="$body" fontWeight="bold">
                                    ₹{activity.amount}
                                </Text>
                            </XStack>
                        ))
                    )}
                </YStack>
            </ScrollView>
        </View >
    );
}
