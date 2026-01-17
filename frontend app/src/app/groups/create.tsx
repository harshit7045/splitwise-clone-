import { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { YStack, Text } from 'tamagui';
import { useRouter } from 'expo-router';
import client from '../../api/client';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { NeoInput } from '../../components/ui/NeoInput';

export default function CreateGroupScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await client.post('/expenses/groups/', { name });
            router.replace('/(tabs)'); // Go back to dashboard to see new group
        } catch (error) {
            Alert.alert("Error", "Could not create group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', padding: 20, justifyContent: 'center' }}>
            <Text color="$color" fontSize={24} fontFamily="$heading" marginBottom="$4">Name your Squad</Text>
            <NeoInput placeholder="e.g. Goa Trip, Office Lunch" value={name} onChangeText={setName} />
            <YStack height={20} />
            <NeoButton onPress={handleCreate} disabled={loading}>
                <NeoButtonText>{loading ? 'Creating...' : 'Create Squad'}</NeoButtonText>
            </NeoButton>
        </View>
    );
}
