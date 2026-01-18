import { View, ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Circle, Button, Separator } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, ArrowLeft } from 'lucide-react-native';
import { NeoCard } from '../../components/ui/NeoCard';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { ActivityIndicator } from 'react-native';
import React, { useState } from 'react';

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [showBalances, setShowBalances] = useState(false);

    // 1. Fetch Expenses
    const { data: expensesData, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
        queryKey: ['expenses', id],
        queryFn: async () => (await client.get(`/expenses/groups/${id}/expenses`)).data
    });

    // 2. Fetch Group Details (Name)
    const { data: groupData, isLoading: groupLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => (await client.get(`/expenses/groups/${id}`)).data
    });

    // 3. Fetch Balances (Lazy load)
    const { data: balances } = useQuery({
        queryKey: ['balances', id],
        queryFn: async () => (await client.get(`/expenses/groups/${id}/balances`)).data,
        enabled: showBalances
    });

    const onRefresh = React.useCallback(() => {
        refetchExpenses();
    }, []);

    if (expensesLoading || groupLoading) return <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center' }}><ActivityIndicator /></View>;

    const expenses = expensesData?.results || [];

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', paddingTop: 60 }}>
            {/* Header */}
            <XStack alignItems="center" paddingHorizontal="$4" marginBottom="$4" justifyContent="space-between">
                <XStack alignItems="center" space="$3">
                    <Button icon={ArrowLeft} chromeless onPress={() => router.back()} color="$color" />
                    <Text fontFamily="$heading" fontSize={24} color="$color">{groupData?.name || 'Group'}</Text>
                </XStack>
                <Circle size={40} backgroundColor="$secondary">
                    <Text fontSize={18} top={1}>🌴</Text>
                </Circle>
            </XStack>

            {/* Toggle Balances Button */}
            <XStack justifyContent="center" marginBottom="$4">
                <Button
                    size="$3"
                    backgroundColor={showBalances ? "$primary" : "#2B2D31"}
                    onPress={() => setShowBalances(!showBalances)}
                    borderColor="$borderColor"
                    borderWidth={1}
                >
                    <Text color={showBalances ? "black" : "white"} fontFamily="$heading">
                        {showBalances ? "HIDE DEBTS" : "VIEW DEBTS"}
                    </Text>
                </Button>
            </XStack>

            {/* Content Switcher */}
            {showBalances ? (
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <YStack space="$3">
                        {balances?.length === 0 && <Text color="$color" opacity={0.5} textAlign='center'>No debts found.</Text>}
                        {balances?.map((b: any) => (
                            <XStack key={b.user_id} justifyContent="space-between" backgroundColor="#2B2D31" padding="$4" borderRadius={12} borderWidth={1} borderColor="$borderColor">
                                <Text color="white" fontFamily="$body" fontSize={16}>{b.user}</Text>
                                <Text color={b.status === "You are owed" ? "$primary" : "$error"} fontFamily="$heading">
                                    {b.status === "You are owed" ? "gets" : "owes"} ₹{Math.abs(b.amount)}
                                </Text>
                            </XStack>
                        ))}
                    </YStack>
                </ScrollView>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#D0FF48" />}
                >
                    {expenses.length === 0 && <Text color="$color" textAlign="center" opacity={0.5}>No expenses yet. Start spending!</Text>}

                    <YStack space="$4">
                        {expenses.map((expense: any) => {
                            const isMe = expense.paid_by === user?.id; // CHECK REAL ID
                            return (
                                <XStack key={expense.id} justifyContent={isMe ? 'flex-end' : 'flex-start'}>
                                    {!isMe && <Circle size={30} backgroundColor="gray" marginRight="$2"><Text>{expense.paid_by_name?.[0]}</Text></Circle>}

                                    <YStack>
                                        <NeoCard
                                            maxWidth="80%"
                                            backgroundColor={isMe ? '#2B2D31' : '#1E1E1E'}
                                            borderColor={isMe ? '$primary' : '$borderColor'}
                                            padding="$3"
                                            borderTopRightRadius={isMe ? 4 : 16}
                                            borderTopLeftRadius={!isMe ? 4 : 16}
                                        >
                                            <Text fontFamily="$heading" fontSize={16} color="$color">{expense.description}</Text>
                                            <Text fontFamily="$heading" fontSize={24} color={isMe ? '$primary' : '$color'}>₹{expense.amount}</Text>
                                            <Text fontSize={10} opacity={0.6} color="$color" marginTop="$1">
                                                {isMe ? `Paid by you` : `Paid by ${expense.paid_by_name}`}
                                            </Text>
                                        </NeoCard>
                                    </YStack>
                                </XStack>
                            );
                        })}
                    </YStack>
                </ScrollView>
            )}

            {/* FAB (Only show when not in balances mode) */}
            {!showBalances && (
                <View style={{ position: 'absolute', bottom: 30, right: 20 }}>
                    <Button
                        size="$6"
                        circular
                        backgroundColor="$primary"
                        elevation={10}
                        icon={<Plus size={30} color="black" />}
                        onPress={() => router.push({ pathname: '/add-expense', params: { group_id: id } })}
                    />
                </View>
            )}
        </View>
    );
}
