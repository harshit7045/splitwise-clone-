import { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert } from 'react-native';
import { YStack, XStack, Text, Button, Circle } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import client from '../../api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { NeoInput } from '../../components/ui/NeoInput';

export default function AddExpenseScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { group_id } = useLocalSearchParams();

    // 1. Fetch Real Group Members
    const { data: members = [], isSuccess } = useQuery({
        queryKey: ['members', group_id],
        queryFn: async () => (await client.get(`/expenses/groups/${group_id}/members/`)).data,
        enabled: !!group_id
    });

    // 2. Auto-select all members
    useEffect(() => {
        if (isSuccess && members.length > 0) {
            setSelectedUsers(members.map((m: any) => m.id));
        }
    }, [isSuccess, members]);

    const toggleUser = (id: number) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const handleSplit = async () => {
        if (!amount || !description || selectedUsers.length === 0) {
            Alert.alert("Error", "Please enter amount, description, and select at least one person.");
            return;
        }

        setIsSubmitting(true);
        try {
            const totalAmount = parseFloat(amount);
            const count = selectedUsers.length;

            // 1. Calculate the base amount (floor to 2 decimals)
            const baseSplit = Math.floor((totalAmount / count) * 100) / 100;

            // 2. Calculate the remainder (pennies left over)
            const currentSum = baseSplit * count;
            const remainder = Math.round((totalAmount - currentSum) * 100) / 100;

            // 3. Distribute shares (Give remainder to the first person)
            const shares = selectedUsers.map((userId, index) => {
                const shareAmount = (index === 0) ? (baseSplit + remainder).toFixed(2) : baseSplit.toFixed(2);
                return {
                    user_id: userId,
                    amount: shareAmount
                };
            });

            const payload = {
                description: description,
                amount: totalAmount,
                category: 'OTHER',
                shares: shares
            };

            await client.post(`/expenses/groups/${group_id}/expenses/`, payload);

            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['globalBalance'] });
            queryClient.invalidateQueries({ queryKey: ['recentActivity'] });

            router.back();
        } catch (error: any) {
            console.error("Failed to add expense", error);
            Alert.alert("Error", "Failed to add expense.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <XStack justifyContent="flex-end" padding="$4" paddingTop={50}>
                <Button icon={X} size="$3" circular chromeless color="white" onPress={() => router.back()} />
            </XStack>

            <YStack flex={1} padding="$4" space="$5">
                <YStack alignItems="center" space="$2">
                    <Text color="$color" opacity={0.5} fontFamily="$body">ENTER AMOUNT</Text>
                    <XStack alignItems="center">
                        <Text color="$primary" fontSize={64} fontFamily="$heading">₹</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor="#444"
                            keyboardType="numeric"
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

                <YStack space="$3">
                    <Text color="$color" fontFamily="$heading" fontSize={16}>SPLIT WITH</Text>
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
                                        <Text color="$color" opacity={isSelected ? 1 : 0.5} fontSize={12}>{member.name || member.username}</Text>
                                    </YStack>
                                )
                            })}
                        </XStack>
                    </ScrollView>
                </YStack>

                <View style={{ flex: 1 }} />

                <NeoButton onPress={handleSplit} disabled={!amount || isSubmitting}>
                    <NeoButtonText>{isSubmitting ? 'SPLITTING...' : 'SPLIT IT 💸'}</NeoButtonText>
                </NeoButton>
            </YStack>
        </View>
    );
}
