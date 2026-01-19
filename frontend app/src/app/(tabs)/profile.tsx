import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Separator, Circle } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { ActivityIndicator } from 'react-native';
import React from 'react';
import { formatCurrency } from '../../utils/format';

export default function ProfileScreen() {
    const { logout, user } = useAuth();
    const router = useRouter();

    // Fetch all groups
    const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
        queryKey: ['userGroups'],
        queryFn: async () => (await client.get('/expenses/groups')).data
    });

    const groupIds = groupsData || [];

    // Fetch balances for all groups
    const balanceQueries = useQuery({
        queryKey: ['allBalances', groupIds.map((g: any) => g.id || g._id)],
        queryFn: async () => {
            const balances = await Promise.all(
                groupIds.map(async (group: any) => {
                    const groupId = group.id || group._id;
                    const result = await client.get(`/expenses/groups/${groupId}/balances`);
                    return { groupId, groupName: group.name, data: result.data };
                })
            );
            return balances;
        },
        enabled: groupIds.length > 0
    });

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    if (groupsLoading || balanceQueries.isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center' }}>
                <ActivityIndicator color="#D0FF48" />
            </View>
        );
    }

    // Calculate totals across all groups
    let totalYouOwe = 0;
    let totalOwedToYou = 0;
    const allBalances = balanceQueries.data || [];

    allBalances.forEach((groupBalance: any) => {
        const members = groupBalance.data?.members || [];
        members.forEach((member: any) => {
            if (member.amount < 0) {
                // Negative amount means you owe them
                totalYouOwe += Math.abs(member.amount);
            } else if (member.amount > 0) {
                // Positive amount means they owe you
                totalOwedToYou += member.amount;
            }
        });
    });

    const netBalance = totalOwedToYou - totalYouOwe;

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingTop: 60 }}
                refreshControl={<RefreshControl refreshing={groupsLoading} onRefresh={refetchGroups} tintColor="#D0FF48" />}
            >
                <YStack space="$4">
                    {/* Header */}
                    <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={32} fontWeight="800" color="$color" fontFamily="$heading">
                            My Debts
                        </Text>
                        <TouchableOpacity onPress={handleLogout} style={{ padding: 10, backgroundColor: '#FF4D4D', borderRadius: 8 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>LOGOUT</Text>
                        </TouchableOpacity>
                    </XStack>

                    {/* User Info */}
                    <Text color="$gray10" fontSize={14}>
                        {user?.email || 'Not logged in'}
                    </Text>

                    <Separator marginVertical="$2" />

                    {/* Net Balance Summary */}
                    <Card bordered padding="$5" backgroundColor="#2B2D31" borderRadius="$4" borderColor="$primary" borderWidth={2}>
                        <YStack space="$3" alignItems="center">
                            <Text fontSize={16} color="$gray10" opacity={0.8}>Overall Balance</Text>
                            <Text
                                fontSize={48}
                                fontWeight="900"
                                color={netBalance >= 0 ? '$primary' : '#FF6B6B'}
                                fontFamily="$heading"
                            >
                                {formatCurrency(netBalance)}
                            </Text>
                            <Text fontSize={14} color="$gray10">
                                {netBalance > 0
                                    ? 'You are owed overall'
                                    : netBalance < 0
                                        ? 'You owe overall'
                                        : 'You are settled up!'}
                            </Text>
                        </YStack>
                    </Card>

                    {/* Breakdown */}
                    <YStack space="$3">
                        {/* You Owe Card */}
                        <Card bordered padding="$4" backgroundColor="#2B2D31" borderRadius="$4" borderColor="#FF6B6B" borderWidth={1}>
                            <YStack space="$2">
                                <XStack justifyContent="space-between" alignItems="center">
                                    <XStack space="$2" alignItems="center">
                                        <Circle size={12} backgroundColor="#FF6B6B" />
                                        <Text fontSize={16} fontWeight="600" color="$color">You Owe</Text>
                                    </XStack>
                                    <Text fontSize={24} fontWeight="bold" color="#FF6B6B">
                                        {formatCurrency(totalYouOwe)}
                                    </Text>
                                </XStack>
                            </YStack>
                        </Card>

                        {/* You Are Owed Card */}
                        <Card bordered padding="$4" backgroundColor="#2B2D31" borderRadius="$4" borderColor="$primary" borderWidth={1}>
                            <YStack space="$2">
                                <XStack justifyContent="space-between" alignItems="center">
                                    <XStack space="$2" alignItems="center">
                                        <Circle size={12} backgroundColor="$primary" />
                                        <Text fontSize={16} fontWeight="600" color="$color">You Are Owed</Text>
                                    </XStack>
                                    <Text fontSize={24} fontWeight="bold" color="$primary">
                                        {formatCurrency(totalOwedToYou)}
                                    </Text>
                                </XStack>
                            </YStack>
                        </Card>
                    </YStack>

                    {/* Groups Summary */}
                    {groupIds.length > 0 && (
                        <Card bordered padding="$4" backgroundColor="#2B2D31" borderRadius="$4" borderColor="$borderColor">
                            <Text fontSize={14} color="$gray10" marginBottom="$2">
                                💼 Active in {groupIds.length} group{groupIds.length !== 1 ? 's' : ''}
                            </Text>
                            <YStack space="$1">
                                {groupIds.map((group: any, i: number) => (
                                    <Text key={i} fontSize={12} color="$color" opacity={0.7}>
                                        • {group.name}
                                    </Text>
                                ))}
                            </YStack>
                        </Card>
                    )}

                    {groupIds.length === 0 && (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text color="$gray10" fontSize={16} textAlign="center">
                                😊 You're all settled up!
                            </Text>
                            <Text color="$gray10" fontSize={14} textAlign="center" marginTop="$2">
                                Join a group to start splitting expenses
                            </Text>
                        </View>
                    )}
                </YStack>
            </ScrollView>
        </View>
    );
}
