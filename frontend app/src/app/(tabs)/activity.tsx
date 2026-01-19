import { View, ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Circle } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import React from 'react';
import { formatCurrency } from '../../utils/format';

export default function ActivityScreen() {
    // Reuse the same query as HomeScreen
    const { data: activitiesData, isLoading, refetch } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => (await client.get('/expenses/activity')).data
    });

    const activities = activitiesData?.results || [];

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingTop: 60 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#D0FF48" />}
            >
                <Text fontSize={32} fontWeight="800" color="$color" fontFamily="$heading" marginBottom="$4">
                    Activity
                </Text>

                <YStack space="$3">
                    {activities.length === 0 ? (
                        <Text color="$color" opacity={0.5} textAlign="center" marginTop="$10">No recent activity found.</Text>
                    ) : (
                        activities.map((activity: any) => (
                            <XStack key={activity.id} backgroundColor="#2B2D31" padding="$4" borderRadius={12} alignItems="center" justifyContent="space-between" borderBottomWidth={1} borderColor="#36393F">
                                <XStack space="$3" alignItems="center" flex={1}>
                                    <Circle size={44} backgroundColor="$secondary">
                                        <Text fontSize={20}>💸</Text>
                                    </Circle>
                                    <YStack flex={1}>
                                        <Text color="$color" fontWeight="bold" fontSize={16}>{activity.description}</Text>
                                        <Text color="$color" fontSize={12} opacity={0.6} marginTop="$1">
                                            {activity.paid_by_name?.split(' ')[0]} paid • {new Date(activity.created_at).toLocaleDateString()}
                                        </Text>
                                        {/* Show who owes whom if possible, or just the group name */}
                                        {activity.group_name && (
                                            <Text color="$primary" fontSize={10} fontWeight="bold" marginTop="$1">{activity.group_name}</Text>
                                        )}
                                    </YStack>
                                </XStack>
                                <YStack alignItems="flex-end">
                                    <Text color="$primary" fontFamily="$body" fontWeight="bold" fontSize={18}>
                                        {formatCurrency(activity.amount)}
                                    </Text>
                                    <Text color="$gray10" fontSize={10}>Total</Text>
                                </YStack>
                            </XStack>
                        ))
                    )}
                </YStack>
            </ScrollView>
        </View>
    );
}
