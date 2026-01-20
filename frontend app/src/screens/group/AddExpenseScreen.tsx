import { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Button, Circle } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import client from '../../api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { NeoInput } from '../../components/ui/NeoInput';

type SplitMode = 'EQUAL_ALL' | 'EQUAL_SELECTED' | 'CUSTOM';

export default function AddExpenseScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [splitMode, setSplitMode] = useState<SplitMode>('EQUAL_SELECTED');
    const [customAmounts, setCustomAmounts] = useState<{ [key: number]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const { group_id } = useLocalSearchParams();

    // 1. Fetch Real Group Members
    const { data: members = [], isSuccess } = useQuery({
        queryKey: ['members', group_id],
        queryFn: async () => (await client.get(`/expenses/groups/${group_id}/members`)).data,
        enabled: !!group_id
    });

    // 2. Auto-select all members when in EQUAL_ALL mode
    useEffect(() => {
        if (isSuccess && members.length > 0) {
            if (splitMode === 'EQUAL_ALL') {
                setSelectedUsers(members.map((m: any) => m.id));
            }
        }
    }, [isSuccess, members, splitMode]);

    // Initialize custom amounts when users change
    useEffect(() => {
        if (splitMode === 'CUSTOM' && selectedUsers.length > 0) {
            const newAmounts: { [key: number]: string } = {};
            selectedUsers.forEach(id => {
                newAmounts[id] = customAmounts[id] || '';
            });
            setCustomAmounts(newAmounts);
        }
    }, [selectedUsers, splitMode]);

    const toggleUser = (id: number) => {
        if (splitMode === 'EQUAL_ALL') return; // Can't deselect in EQUAL_ALL mode

        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const handleSplitModeChange = (mode: SplitMode) => {
        setSplitMode(mode);
        if (mode === 'EQUAL_ALL') {
            setSelectedUsers(members.map((m: any) => m.id));
        }
    };

    const updateCustomAmount = (userId: number, value: string) => {
        setCustomAmounts(prev => ({ ...prev, [userId]: value }));
    };

    // Calculate validation state for custom split
    const getCustomValidation = () => {
        const totalAmount = parseFloat(amount || '0');
        const totalEntered = selectedUsers.reduce((sum, id) => {
            return sum + parseFloat(customAmounts[id] || '0');
        }, 0);
        const difference = totalAmount - totalEntered;
        const isValid = Math.abs(difference) < 0.01;

        return { totalEntered, difference, isValid };
    };

    const handleSplit = async () => {
        setError('');

        if (!description || description.trim() === '') {
            setError("Please enter what this expense is for");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid positive amount");
            return;
        }

        if (selectedUsers.length === 0) {
            setError("Please select at least one person to split with");
            return;
        }

        // Custom split validation
        if (splitMode === 'CUSTOM') {
            const { isValid, difference } = getCustomValidation();
            if (!isValid) {
                if (difference > 0) {
                    setError(`₹${Math.abs(difference).toFixed(2)} remaining to allocate`);
                } else {
                    setError(`₹${Math.abs(difference).toFixed(2)} over the total amount`);
                }
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const totalAmount = parseFloat(amount);
            let shares;

            if (splitMode === 'CUSTOM') {
                // Use custom amounts
                shares = selectedUsers.map(userId => ({
                    user_id: userId,
                    amount: parseFloat(customAmounts[userId] || '0').toFixed(2)
                }));
            } else {
                // Equal split calculation
                const count = selectedUsers.length;
                const baseSplit = Math.floor((totalAmount / count) * 100) / 100;
                const currentSum = baseSplit * count;
                const remainder = Math.round((totalAmount - currentSum) * 100) / 100;

                shares = selectedUsers.map((userId, index) => {
                    const shareAmount = (index === 0) ? (baseSplit + remainder).toFixed(2) : baseSplit.toFixed(2);
                    return {
                        user_id: userId,
                        amount: shareAmount
                    };
                });
            }

            const payload = {
                description: description,
                amount: totalAmount,
                category: 'OTHER',
                shares: shares
            };

            console.log("Splitting Expense - Request:", JSON.stringify(payload, null, 2));
            const response = await client.post(`/expenses/groups/${group_id}/expenses`, payload);
            console.log("Splitting Expense - Response:", JSON.stringify(response.data, null, 2));

            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['globalBalance'] });
            queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
            queryClient.invalidateQueries({ queryKey: ['balances'] });

            setIsSubmitting(false);
            router.back();
        } catch (error: any) {
            console.error("Failed to add expense", error);
            const errorMsg = error.response?.data?.error || "Failed to add expense. Please try again.";
            Alert.alert("Error", errorMsg);
            setIsSubmitting(false);
        }
    };

    // Form validation
    const isValid = () => {
        if (!description.trim() || parseFloat(amount || '0') <= 0 || selectedUsers.length === 0) {
            return false;
        }
        if (splitMode === 'CUSTOM') {
            return getCustomValidation().isValid;
        }
        return true;
    };

    const validation = splitMode === 'CUSTOM' ? getCustomValidation() : null;

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <XStack justifyContent="flex-end" padding="$4" paddingTop={50}>
                <Button icon={X} size="$3" circular chromeless color="white" onPress={() => router.back()} />
            </XStack>

            <ScrollView style={{ flex: 1 }}>
                <YStack padding="$4" space="$5">
                    <YStack alignItems="center" space="$2">
                        <Text color="$color" opacity={0.5} fontFamily="$body">ENTER AMOUNT</Text>
                        <XStack alignItems="center">
                            <Text color="$primary" fontSize={64} fontFamily="$heading">₹</Text>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor="#444"
                                keyboardType="decimal-pad"
                                autoFocus
                                style={{ fontSize: 64, color: '#D0FF48', fontFamily: 'InterBold', minWidth: 50 }}
                            />
                        </XStack>
                    </YStack>

                    <NeoInput
                        placeholder="What's this for?"
                        value={description}
                        onChangeText={setDescription}
                        textAlign="center"
                    />

                    {/* Split Mode Selector */}
                    <YStack space="$2">
                        <Text color="$color" fontFamily="$heading" fontSize={14}>SPLIT MODE</Text>
                        <XStack space="$2">
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: splitMode === 'EQUAL_ALL' ? '#D0FF48' : '#2B2D31',
                                    padding: 10,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={() => handleSplitModeChange('EQUAL_ALL')}
                            >
                                <Text color={splitMode === 'EQUAL_ALL' ? 'black' : 'white'} fontSize={12} fontWeight="bold">
                                    All Equal
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: splitMode === 'EQUAL_SELECTED' ? '#D0FF48' : '#2B2D31',
                                    padding: 10,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={() => handleSplitModeChange('EQUAL_SELECTED')}
                            >
                                <Text color={splitMode === 'EQUAL_SELECTED' ? 'black' : 'white'} fontSize={12} fontWeight="bold">
                                    Selected Equal
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: splitMode === 'CUSTOM' ? '#D0FF48' : '#2B2D31',
                                    padding: 10,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                                onPress={() => handleSplitModeChange('CUSTOM')}
                            >
                                <Text color={splitMode === 'CUSTOM' ? 'black' : 'white'} fontSize={12} fontWeight="bold">
                                    Custom
                                </Text>
                            </TouchableOpacity>
                        </XStack>
                    </YStack>

                    {/* Member Selection/Custom Input */}
                    <YStack space="$3">
                        <Text color="$color" fontFamily="$heading" fontSize={16}>
                            {splitMode === 'CUSTOM' ? 'ENTER AMOUNTS' : 'SPLIT WITH'}
                        </Text>

                        {splitMode !== 'CUSTOM' ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <XStack space="$4">
                                    {members.map((member: any) => {
                                        const isSelected = selectedUsers.includes(member.id);
                                        return (
                                            <YStack key={member.id} alignItems="center" space="$2" onPress={() => toggleUser(member.id)}>
                                                <Circle
                                                    size={60}
                                                    backgroundColor={isSelected ? '$primary' : '#2B2D31'}
                                                    borderWidth={2}
                                                    borderColor={isSelected ? '$primary' : '$borderColor'}
                                                >
                                                    <Text fontSize={20} color={isSelected ? 'black' : 'white'} fontWeight="bold">
                                                        {member.name?.[0] || member.username?.[0]?.toUpperCase()}
                                                    </Text>
                                                </Circle>
                                                <Text color="$color" opacity={isSelected ? 1 : 0.5} fontSize={12}>
                                                    {member.name || member.username}
                                                </Text>
                                            </YStack>
                                        );
                                    })}
                                </XStack>
                            </ScrollView>
                        ) : (
                            <YStack space="$3">
                                {selectedUsers.map(userId => {
                                    const member = members.find((m: any) => m.id === userId);
                                    if (!member) return null;

                                    return (
                                        <XStack key={userId} alignItems="center" space="$3" backgroundColor="#2B2D31" padding="$3" borderRadius={8}>
                                            <Circle size={40} backgroundColor="$primary">
                                                <Text fontSize={16} color="black" fontWeight="bold">
                                                    {member.name?.[0] || member.username?.[0]?.toUpperCase()}
                                                </Text>
                                            </Circle>
                                            <Text flex={1} color="$color">
                                                {member.name || member.username}
                                            </Text>
                                            <XStack alignItems="center" space="$2">
                                                <Text color="$primary" fontSize={20}>₹</Text>
                                                <TextInput
                                                    value={customAmounts[userId] || ''}
                                                    onChangeText={(value) => updateCustomAmount(userId, value)}
                                                    placeholder="0"
                                                    placeholderTextColor="#444"
                                                    keyboardType="decimal-pad"
                                                    style={{
                                                        fontSize: 18,
                                                        color: '#D0FF48',
                                                        backgroundColor: '#1E1E1E',
                                                        padding: 8,
                                                        borderRadius: 4,
                                                        minWidth: 80,
                                                        textAlign: 'right'
                                                    }}
                                                />
                                            </XStack>
                                        </XStack>
                                    );
                                })}

                                {/* Validation Summary */}
                                {validation && parseFloat(amount || '0') > 0 && (
                                    <YStack backgroundColor="#2B2D31" padding="$3" borderRadius={8} borderWidth={2} borderColor={validation.isValid ? '#D0FF48' : '#FF6B6B'}>
                                        <XStack justifyContent="space-between">
                                            <Text color="$color">Total Amount:</Text>
                                            <Text color="$primary" fontWeight="bold">₹{parseFloat(amount).toFixed(2)}</Text>
                                        </XStack>
                                        <XStack justifyContent="space-between" marginTop="$2">
                                            <Text color="$color">Allocated:</Text>
                                            <Text color={validation.isValid ? '#D0FF48' : '#FF6B6B'} fontWeight="bold">
                                                ₹{validation.totalEntered.toFixed(2)}
                                            </Text>
                                        </XStack>
                                        {!validation.isValid && (
                                            <Text color={validation.difference > 0 ? '#FF6B6B' : '#FFA500'} fontSize={12} marginTop="$2" textAlign="center">
                                                {validation.difference > 0
                                                    ? `₹${Math.abs(validation.difference).toFixed(2)} remaining`
                                                    : `₹${Math.abs(validation.difference).toFixed(2)} over`}
                                            </Text>
                                        )}
                                    </YStack>
                                )}
                            </YStack>
                        )}
                    </YStack>

                    {error && (
                        <Text color="#FF6B6B" fontSize={14} textAlign="center" marginTop="$2">⚠️ {error}</Text>
                    )}

                    <NeoButton onPress={handleSplit} disabled={!isValid() || isSubmitting} opacity={!isValid() ? 0.5 : 1}>
                        <NeoButtonText>{isSubmitting ? 'SPLITTING...' : 'SPLIT IT 💸'}</NeoButtonText>
                    </NeoButton>
                </YStack>
            </ScrollView>
        </View>
    );
}
