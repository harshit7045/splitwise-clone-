import { View, ScrollView } from 'react-native';
import { YStack, XStack, Text, Circle, Avatar, Button } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, ArrowLeft } from 'lucide-react-native';
import { NeoCard } from '../../components/ui/NeoCard';

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Mock Expense Data
    const expenses = [
        { id: 1, description: 'Lunch', amount: 500, paidBy: 'rudra', paidById: 1, split: 'You owe ₹250' },
        { id: 2, description: 'Uber', amount: 120, paidBy: 'alice', paidById: 2, split: 'You owe ₹60' },
        { id: 3, description: 'Movie Tickets', amount: 800, paidBy: 'rudra', paidById: 1, split: 'You owe ₹400' },
    ];

    const currentUserId = 1; // Mock current user

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', paddingTop: 60 }}>
            {/* Header */}
            <XStack alignItems="center" paddingHorizontal="$4" marginBottom="$4" justifyContent="space-between">
                <XStack alignItems="center" space="$3">
                    <Button icon={ArrowLeft} chromeless onPress={() => router.back()} color="$color" />
                    <Text fontFamily="$heading" fontSize={24} color="$color">Goa Trip 2025</Text>
                </XStack>
                <Circle size={40} backgroundColor="$secondary">
                    <Text fontSize={18} top={1}>🌴</Text>
                </Circle>
            </XStack>

            {/* Expense Chat Stream */}
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <YStack space="$4">
                    <Text textAlign="center" opacity={0.5} fontSize={12} color="$color">Today</Text>

                    {expenses.map((expense) => {
                        const isMe = expense.paidById === currentUserId;
                        return (
                            <XStack key={expense.id} justifyContent={isMe ? 'flex-end' : 'flex-start'}>
                                {!isMe && <Circle size={30} backgroundColor="gray" marginRight="$2"><Text>{expense.paidBy[0]}</Text></Circle>}

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
                                            {isMe ? `Paid by you • ${expense.split}` : `Paid by ${expense.paidBy} • ${expense.split}`}
                                        </Text>
                                    </NeoCard>
                                </YStack>
                            </XStack>
                        );
                    })}
                </YStack>
            </ScrollView>

            {/* FAB */}
            <View style={{ position: 'absolute', bottom: 30, right: 20 }}>
                <Button
                    size="$6"
                    circular
                    backgroundColor="$primary"
                    elevation={10}
                    icon={<Plus size={30} color="black" />}
                    onPress={() => router.push('/add-expense')}
                />
            </View>
        </View>
    );
}
