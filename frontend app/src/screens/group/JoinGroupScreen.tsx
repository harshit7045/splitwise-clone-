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

    const handleJoin = async () => {
        if (!groupId || groupId.trim() === '') {
            Alert.alert("Error", "Please enter a Group ID");
            return;
        }

        setIsJoining(true);
        try {
            await client.post(`/expenses/groups/${groupId}/join`);
            Alert.alert("Success", "You have joined the group!");
            router.back(); // Navigate back to dashboard
        } catch (error: any) {
            // Specific handling for different error codes
            if (error.response?.status === 404) {
                Alert.alert("Not Found", "No group exists with that ID.");
            } else if (error.response?.status === 400 && error.response?.data?.error?.includes('already a member')) {
                Alert.alert("Already Joined", "You are already a member of this group.");
            } else if (error.response?.status === 400 && error.response?.data?.error?.includes('Invalid')) {
                Alert.alert("Invalid ID", "The Group ID format is invalid. Please check and try again.");
            } else {
                const msg = error.response?.data?.error || "Failed to join group. Please check your connection.";
                Alert.alert("Error", msg);
            }
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', padding: 20, paddingTop: 60 }}>
            <XStack alignItems="center" marginBottom="$6">
                <Button icon={ArrowLeft} chromeless onPress={() => router.back()} color="$color" />
                <Text fontFamily="$heading" fontSize={24} color="$color" marginLeft="$2">Join Squad</Text>
            </XStack>

            <YStack space="$4">
                <Text color="$color" opacity={0.7}>Enter the Group ID to join an existing squad.</Text>

                <NeoInput
                    placeholder="Group ID (e.g. 15)"
                    value={groupId}
                    onChangeText={setGroupId}
                    keyboardType="numeric"
                />

                <NeoButton onPress={handleJoin} disabled={isJoining || !groupId}>
                    <NeoButtonText>{isJoining ? 'JOINING...' : 'JOIN SQUAD'}</NeoButtonText>
                </NeoButton>
            </YStack>
        </View>
    );
}
