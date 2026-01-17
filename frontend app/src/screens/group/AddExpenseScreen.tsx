import { useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { YStack, XStack, Text, Button, Circle, Avatar } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import client from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { NeoInput } from '../../components/ui/NeoInput';

export default function AddExpenseScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([1, 2, 3]); // Default everyone selected

    const { group_id } = useLocalSearchParams();

    // 1. Fetch Real Group Members
    const { data: members = [] } = useQuery({
        queryKey: ['members', group_id],
        queryFn: async () => {
            const response = await client.get(`/expenses/groups/${group_id}/members/`);
            return response.data; // Backend returns [{id, username, name, email}, ...]
        },
        enabled: !!group_id // Only run if we have an ID
    });

    const toggleUser = (id: number) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };



    const handleSplit = async () => {
        try {
            if (!amount || !description) return;

            // Calculate split amount (simple equal split for now)
            const splitAmount = (parseFloat(amount) / selectedUsers.length).toFixed(2);

            const payload = {
                description: description,
                amount: parseFloat(amount),
                category: 'OTHER', // Default category
                shares: selectedUsers.map(userId => ({
                    user_id: userId,
                    amount: splitAmount
                }))
            };

            await client.post(`/expenses/groups/${group_id}/expenses/`, payload);

            router.back();
        } catch (error) {
            console.error("Failed to add expense", error);
            alert("Failed to add expense");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
            <XStack justifyContent="flex-end" padding="$4" paddingTop={50}>
                <Button icon={X} size="$3" circular chromeless color="white" onPress={() => router.back()} />
            </XStack>

            <YStack flex={1} padding="$4" space="$5">

                {/* Amount Input */}
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
                            style={{
                                fontSize: 64,
                                color: '#D0FF48',
                                fontFamily: 'InterBold', // Fallback
                                minWidth: 50
                            }}
                        />
                    </XStack>
                </YStack>

                {/* Description */}
                <NeoInput
                    placeholder="What's this for?"
                    value={description}
                    onChangeText={setDescription}
                    textAlign="center"
                />

                {/* Split With */}
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

                <NeoButton onPress={handleSplit} disabled={!amount}>
                    <NeoButtonText>SPLIT IT 💸</NeoButtonText>
                </NeoButton>
            </YStack>
        </View>
    );
}
