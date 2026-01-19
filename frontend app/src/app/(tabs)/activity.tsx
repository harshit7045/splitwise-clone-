import { View, ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Circle } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';
import React from 'react';
import { formatCurrency } from '../../utils/format';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

export default function ActivityScreen() {
    const { user } = useAuth();

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
                        activities.map((activity: any) => {
                            // Determine if this is an outgoing (user paid) or incoming (others paid) expense
                            const isOutgoing = activity.paid_by_name === user?.name || activity.paid_by_name === user?.username;
                            const backgroundColor = isOutgoing ? '#2B2D31' : '#2B2D31';
                            const iconBg = isOutgoing ? '#FF6B6B' : '#D0FF48';
                            const icon = isOutgoing ? '↗️' : '↙️';
                            const accentColor = isOutgoing ? '#FF6B6B' : '#D0FF48';
                            const typeLabel = isOutgoing ? 'You paid' : `${activity.paid_by_name?.split(' ')[0]} paid`;

                            return (
                                <XStack
                                    key={activity.id}
                                    backgroundColor={backgroundColor}
                                    padding="$4"
                                    borderRadius={12}
                                    alignItems="center"
                                    justifyContent="space-between"
                                    borderLeftWidth={4}
                                    borderLeftColor={accentColor}
                                >
                                    <XStack space="$3" alignItems="center" flex={1}>
                                        <Circle size={44} backgroundColor={iconBg}>
                                            <Text fontSize={20}>{icon}</Text>
                                        </Circle>
                                        <YStack flex={1}>
                                            <Text color="$color" fontWeight="bold" fontSize={16}>{activity.description}</Text>
                                            <Text color={accentColor} fontSize={12} fontWeight="600" marginTop="$1">
                                                {typeLabel} • {new Date(activity.created_at).toLocaleDateString()}
                                            </Text>
                                            {activity.group_name && (
                                                <Text color="$color" opacity={0.5} fontSize={10} fontWeight="bold" marginTop="$1">{activity.group_name}</Text>
                                            )}
                                        </YStack>
                                    </XStack>
                                    <YStack alignItems="flex-end">
                                        <Text color={accentColor} fontFamily="$body" fontWeight="bold" fontSize={18}>
                                            {formatCurrency(activity.amount)}
                                        </Text>
                                        <Text color="$gray10" fontSize={10}>Total</Text>
                                    </YStack>
                                </XStack>
                            );
                        })
                    )}
                </YStack>
            </ScrollView>
        </View>
    );
}
