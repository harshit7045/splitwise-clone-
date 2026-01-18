import { View, ScrollView, RefreshControl, Modal, TouchableOpacity, Alert } from 'react-native';
import { YStack, XStack, Text, Circle, Button, Separator } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, ArrowLeft, Copy, Users, X } from 'lucide-react-native';
import { NeoCard } from '../../components/ui/NeoCard';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { formatCurrency } from '../../utils/format';

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [showBalances, setShowBalances] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

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

    const copyGroupId = async () => {
        await Clipboard.setStringAsync(id as string);
        Alert.alert("Group ID Copied!", "Share this ID with friends to invite them to the group.");
    };

    if (expensesLoading || groupLoading) return <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center' }}><ActivityIndicator /></View>;

    // Handle both response formats: { results: [...] } or direct array
    const expenses = Array.isArray(expensesData) ? expensesData : (expensesData?.results || []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', paddingTop: 60 }}>
            {/* Header */}
            <YStack paddingHorizontal="$4" marginBottom="$4" space="$3">
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" space="$3">
                        <Button icon={ArrowLeft} chromeless onPress={() => router.back()} color="$color" />
                        <Text fontFamily="$heading" fontSize={24} color="$color">{groupData?.name || 'Group'}</Text>
                    </XStack>
                    <Circle size={40} backgroundColor="$secondary">
                        <Text fontSize={18} top={1}>🌴</Text>
                    </Circle>
                </XStack>

                {/* Action Buttons */}
                <XStack space="$3">
                    <Button size="$3" backgroundColor="#2B2D31" onPress={copyGroupId} icon={<Copy size={16} color="#D0FF48" />} flex={1}>
                        <Text color="$color" fontSize={12}>Copy ID</Text>
                    </Button>
                    <Button size="$3" backgroundColor="#2B2D31" onPress={() => setShowMembers(true)} icon={<Users size={16} color="#D0FF48" />} flex={1}>
                        <Text color="$color" fontSize={12}>{groupData?.members?.length || 0} Members</Text>
                    </Button>
                </XStack>
            </YStack>

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
                    <YStack space="$4">
                        {/* Summary Card */}
                        {balances?.summary && (
                            <NeoCard backgroundColor="#2B2D31" padding="$4" borderColor="$primary" borderWidth={2}>
                                <Text fontSize={18} fontWeight="bold" color="$primary" marginBottom="$3">
                                    💰 Group Summary
                                </Text>
                                <YStack space="$2">
                                    <XStack justifyContent="space-between">
                                        <Text color="$color" opacity={0.8}>You owe the group:</Text>
                                        <Text color="#FF6B6B" fontWeight="bold">₹{balances.summary.totalYouOwe}</Text>
                                    </XStack>
                                    <XStack justifyContent="space-between">
                                        <Text color="$color" opacity={0.8}>Group owes you:</Text>
                                        <Text color="#D0FF48" fontWeight="bold">₹{balances.summary.totalOwesYou}</Text>
                                    </XStack>
                                    <Separator marginVertical="$2" backgroundColor="#3A3D43" />
                                    <XStack justifyContent="space-between">
                                        <Text color="$color" fontWeight="bold">Net Balance:</Text>
                                        <Text
                                            color={balances.summary.netBalance >= 0 ? '#D0FF48' : '#FF6B6B'}
                                            fontWeight="bold"
                                            fontSize={18}
                                        >
                                            {balances.summary.netBalance >= 0 ? '+' : ''}₹{balances.summary.netBalance}
                                        </Text>
                                    </XStack>
                                    <Text fontSize={12} opacity={0.6} color="$color" textAlign="center" marginTop="$2">
                                        {balances.summary.netBalance > 0 ? 'You will receive' : balances.summary.netBalance < 0 ? 'You need to pay' : 'All settled up!'}
                                    </Text>
                                </YStack>
                            </NeoCard>
                        )}

                        {/* Per-Member Breakdown */}
                        {balances?.members?.length === 0 && (
                            <Text color="$color" opacity={0.5} textAlign="center">No debts in this group</Text>
                        )}

                        {balances?.members?.map((member: any) => (
                            <NeoCard key={member.userId} backgroundColor="#2B2D31" padding="$4" borderColor="$borderColor" borderWidth={1}>
                                <Text fontSize={16} fontWeight="bold" color="$color" marginBottom="$3">
                                    👤 {member.name}
                                    <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                                        <Text fontSize={16} fontWeight="bold" color="$color">{member.name}</Text>
                                        <Text fontSize={16} fontWeight="bold" color={member.netBalance >= 0 ? '#D0FF48' : '#FF6B6B'}>
                                            {member.netBalance >= 0 ? 'Gets back' : 'Owes'} {formatCurrency(Math.abs(member.netBalance))}
                                        </Text>
                                    </XStack>
                                    <YStack space="$1">
                                        {member.youOwe > 0 && <Text fontSize={12} color="#FF6B6B">You owe them: {formatCurrency(member.youOwe)}</Text>}
                                        {member.owesYou > 0 && <Text fontSize={12} color="#D0FF48">They owe you: {formatCurrency(member.owesYou)}</Text>}
                                        {member.netBalance === 0 && <Text fontSize={12} color="$color" opacity={0.5}>Settled up</Text>}
                                    </YStack>
                            </NeoCard>
                        ))}
                    </YStack>
                </ScrollView>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={expensesLoading} onRefresh={() => refetchExpenses()} tintColor="#D0FF48" />}
                >
                    <YStack space="$3">
                        {!expenses || expenses.length === 0 ? (
                            <YStack alignItems="center" padding="$8" space="$3">
                                <Text fontSize={64}>💸</Text>
                                <Text color="#D0FF48" fontSize={18} fontWeight="bold">No Expenses Yet</Text>
                                <Text color="$color" opacity={0.6} textAlign="center">
                                    Tap the "+" button below to add your first expense and start splitting!
                                </Text>
                            </YStack>
                        ) : (
                            expenses.map((expense: any) => {
                                if (!expense || !expense.id) return null;

                                const isMe = expense.paid_by === user?.id;
                                const date = expense.created_at ? new Date(expense.created_at) : new Date();
                                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                return (
                                    <NeoCard
                                        key={expense.id}
                                        backgroundColor="#2B2D31"
                                        borderColor={isMe ? '$primary' : '$borderColor'}
                                        borderWidth={isMe ? 2 : 1}
                                        padding="$4"
                                    >
                                        {/* Header: Icon + Date */}
                                        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                                            <XStack alignItems="center" space="$2">
                                                <Circle size={36} backgroundColor={isMe ? '$primary' : '$secondary'}>
                                                    <Text fontSize={16} color={isMe ? 'black' : 'white'}>
                                                        {isMe ? '💳' : expense.paid_by_name?.[0] || '👤'}
                                                    </Text>
                                                </Circle>
                                                <YStack>
                                                    <Text fontSize={10} opacity={0.6} color="$color">{dateStr}</Text>
                                                    <Text fontSize={12} fontWeight="600" color="$color">
                                                        {isMe ? 'You paid' : `${expense.paid_by_name || 'Someone'} paid`}
                                                    </Text>
                                                </YStack>
                                            </XStack>
                                            <YStack alignItems="flex-end">
                                                <Text fontSize={18} fontWeight="bold" color={isMe ? '$primary' : '$color'}>
                                                    {formatCurrency(expense.amount || 0)}
                                                </Text>
                                                <Text fontSize={10} opacity={0.5} color="$color">
                                                    Split {expense.shares?.length || 0} ways
                                                </Text>
                                            </YStack>
                                        </XStack>

                                        {/* Description */}
                                        <Text fontSize={16} color="$color" marginBottom="$3" fontWeight="500">
                                            {expense.description || 'No description'}
                                        </Text>

                                        {/* Split Breakdown */}
                                        {expense.shares && expense.shares.length > 0 && (
                                            <YStack space="$1" backgroundColor="#1E1E1E" padding="$3" borderRadius={8}>
                                                <Text fontSize={12} opacity={0.6} color="$color" marginBottom="$1">Split details:</Text>
                                                {expense.shares.map((share: any, idx: number) => (
                                                    <Text key={idx} fontSize={12} color="$color" opacity={0.8}>
                                                        • {share.user?.name || share.user?.username || `User ${idx + 1}`}: {formatCurrency(share.amount)}
                                                    </Text>
                                                ))}
                                            </YStack>
                                        )}
                                    </NeoCard>
                                );
                            })
                        )}
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

            {/* Members Modal */}
            <Modal visible={showMembers} animationType="slide" transparent={true} onRequestClose={() => setShowMembers(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' }}>
                        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                            <Text fontSize={20} fontWeight="bold" color="$color">Group Members</Text>
                            <TouchableOpacity onPress={() => setShowMembers(false)}>
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        </XStack>

                        <ScrollView>
                            {groupData?.members?.map((member: any) => (
                                <XStack key={member.id || member._id} paddingVertical="$3" alignItems="center" space="$3" borderBottomWidth={1} borderColor="#2B2D31">
                                    <Circle size={40} backgroundColor="$secondary">
                                        <Text fontSize={18} color="white">{member.name?.[0] || member.username?.[0]}</Text>
                                    </Circle>
                                    <YStack>
                                        <Text fontSize={16} fontWeight="600" color="$color">{member.name || member.username}</Text>
                                        <Text fontSize={12} color="$gray10">{member.email}</Text>
                                    </YStack>

                                    <ScrollView>
                                        {groupData?.members?.map((member: any) => (
                                            <XStack key={member.id || member._id} paddingVertical="$3" alignItems="center" space="$3" borderBottomWidth={1} borderColor="#2B2D31">
                                                <Circle size={40} backgroundColor="$secondary">
                                                    <Text fontSize={18} color="white">{member.name?.[0] || member.username?.[0]}</Text>
                                                </Circle>
                                                <YStack>
                                                    <Text fontSize={16} fontWeight="600" color="$color">{member.name || member.username}</Text>
                                                    <Text fontSize={12} color="$gray10">{member.email}</Text>
                                                </YStack>
                                            </XStack>
                                        )) || <Text color="$gray10">No members found</Text>}
                                    </ScrollView>
                                </View>
    </View>
            </Modal>
        </View >
    );
}
