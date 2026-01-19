import { useState } from 'react';
import { View, Alert } from 'react-native';
import { YStack, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import client from '../../api/client';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { NeoInput } from '../../components/ui/NeoInput';

export default function JoinGroupScreen() {
    const router = useRouter();
    const [groupId, setGroupId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            // Calls your existing backend endpoint
            const response = await client.post(`/expenses/groups/${groupId}/join/`);
            Alert.alert("Status", response.data.message);
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert("Error", "Could not find group with that ID");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', padding: 20, paddingTop: 60 }}>
            <Button
                icon={ArrowLeft}
                chromeless
                onPress={() => router.back()}
                color="white"
                position="absolute"
                top={60}
                left={20}
                zIndex={10}
            />
            <YStack justifyContent="center" flex={1}>
                <Text color="$color" fontSize={24} fontFamily="$heading" marginBottom="$4">Enter Squad ID</Text>
                <NeoInput
                    placeholder="Group ID (e.g. 15)"
                    value={groupId}
                    onChangeText={setGroupId}
                    keyboardType="numeric"
                />
                <YStack height={20} />
                <NeoButton onPress={handleJoin} disabled={loading}>
                    <NeoButtonText>{loading ? 'Joining...' : 'Join Squad'}</NeoButtonText>
                </NeoButton>
            </YStack>
        </View>
    );
}
