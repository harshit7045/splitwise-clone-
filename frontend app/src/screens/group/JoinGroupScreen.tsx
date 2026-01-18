import { useState } from 'react';
import { View, Alert } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { NeoInput } from '../../components/ui/NeoInput';
import { ArrowLeft } from 'lucide-react-native';

export default function JoinGroupScreen() {
    const router = useRouter();
    const [groupId, setGroupId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async () => {
        // Clear previous error
        setError('');

        // Validation
        if (!groupId || groupId.trim() === '') {
            setError("Please enter a Group ID");
            return;
        }

        setIsJoining(true);
        try {
            await client.post(`/expenses/groups/${groupId.trim()}/join`);
            Alert.alert("Success", "You have joined the group!");
            router.back();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to join group";
            setError(message);
        } finally {
            setIsJoining(false);
        }
    };

    const isValid = groupId.trim().length > 0;

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', padding: 20, paddingTop: 60 }}>
            <XStack alignItems="center" marginBottom="$6">
                <Button icon={ArrowLeft} chromeless onPress={() => router.back()} color="$color" />
                <Text fontFamily="$heading" fontSize={24} color="$color" marginLeft="$2">Join Squad</Text>
            </XStack>

            <YStack space="$4">
                <Text color="$color" opacity={0.7}>Enter the Group ID to share expenses with your squad.</Text>

                <NeoInput
                    placeholder="Group ID (e.g. 696d11d3fa22ff8216403313)"
                    value={groupId}
                    onChangeText={(text: string) => {
                        setGroupId(text);
                        setError(''); // Clear error on input
                    }}
                    autoCapitalize="none"
                />

                {error && (
                    <Text color="#FF6B6B" fontSize={14} marginTop={-8}>⚠️ {error}</Text>
                )}

                <NeoButton onPress={handleJoin} disabled={isJoining || !isValid} opacity={!isValid ? 0.5 : 1}>
                    <NeoButtonText>{isJoining ? 'JOINING...' : 'JOIN SQUAD'}</NeoButtonText>
                </NeoButton>
            </YStack>
        </View>
    );
}
