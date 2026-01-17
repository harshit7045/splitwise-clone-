import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 20, marginBottom: 20 }}>Profile</Text>
            <TouchableOpacity onPress={handleLogout} style={{ padding: 10, backgroundColor: '#FF4D4D', borderRadius: 8 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>LOGOUT</Text>
            </TouchableOpacity>
        </View>
    );
}
