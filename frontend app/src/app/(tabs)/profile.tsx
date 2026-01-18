import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Separator } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { ActivityIndicator } from 'react-native';
import React from 'react';

interface Debt {
    name: string;
    amount: number;
}

interface GroupBalance {
    groupName: string;
    debts: Debt[];
}

export default function ProfileScreen() {
    const { logout, user } = useAuth();
    const router = useRouter();

    // Fetch all group balances for the user
    const { data: groupsData, isLoading: groupsLoading } = useQuery({
        queryKey: ['userGroups'],
        queryFn: async () => (await client.get('/expenses/groups')).data
    });

    // Fetch balances for each group
    const groupIds = groupsData || [];

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    if (groupsLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center' }}>
                <ActivityIndicator color="#D0FF48" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
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

                    {/* Debt Cards - One per Group */}
                    {groupIds.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text color="$gray10" fontSize={16} textAlign="center">
                                😊 You're all settled up!
                            </Text>
                            <Text color="$gray10" fontSize={14} textAlign="center" marginTop="$2">
                                Join a group to start splitting expenses
                            </Text>
                        </View>
                    ) : (
                        groupIds.map((group: any) => (
                            <GroupBalanceCard key={group.id || group._id} groupId={group.id || group._id} groupName={group.name} />
                        ))
                    )}
                </YStack>
            </ScrollView>
        </View>
    );
}

// Component to fetch and display balances for a single group
function GroupBalanceCard({ groupId, groupName }: { groupId: string; groupName: string }) {
    const { data: balances, isLoading } = useQuery({
        queryKey: ['balances', groupId],
        queryFn: async () => (await client.get(`/expenses/groups/${groupId}/balances`)).data
    });

    if (isLoading) {
        return (
            <Card bordered padding="$4" backgroundColor="#2B2D31" borderRadius="$4">
                <ActivityIndicator size="small" color="#D0FF48" />
            </Card>
        );
    }

    // Filter out zero balances and current user
    const nonZeroBalances = balances?.filter((b: any) => Math.abs(b.amount) > 0.01) || [];

    if (nonZeroBalances.length === 0) {
        return null; // Don't show groups with no debts
    }

    return (
        <Card bordered padding="$4" backgroundColor="#2B2D31" borderRadius="$4" elevation={2} borderColor="$borderColor">
            <Text fontSize={18} fontWeight="bold" marginBottom="$2" color="$primary" fontFamily="$heading">
                {groupName}
            </Text>
            <Separator marginVertical="$2" backgroundColor="#3A3D43" />

            <YStack space="$2">
                {nonZeroBalances.map((balance: any, i: number) => {
                    const isOwed = balance.amount > 0;
                    const displayName = balance.name || balance.user || 'Unknown';

                    return (
                        <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical="$2">
                            <Text fontSize={16} color="$color">
                                {displayName}
                            </Text>
                            <YStack alignItems="flex-end">
                                <Text
                                    fontSize={14}
                                    fontWeight="600"
                                    color={isOwed ? '#D0FF48' : '#FF6B6B'}
                                >
                                    {isOwed ? 'owes you' : 'you owe'}
                                </Text>
                                <Text
                                    fontSize={18}
                                    fontWeight="bold"
                                    color={isOwed ? '#D0FF48' : '#FF6B6B'}
                                >
                                    ₹{Math.abs(balance.amount).toFixed(2)}
                                </Text>
                            </YStack>
                        </XStack>
                    );
                })}
            </YStack>
        </Card>
    );
}
