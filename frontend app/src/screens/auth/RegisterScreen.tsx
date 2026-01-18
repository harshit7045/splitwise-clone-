import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NeoInput } from '../../components/ui/NeoInput';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';

const registerSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [error, setError] = useState('');

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setError(''); // Clear previous errors
            const response = await client.post('/auth/register', data);
            await login(response.data, response.data.token);
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error(err);
            // Capture the backend error message
            const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: '#1E1E1E' }}
        >
            <YStack flex={1} justifyContent="center" padding="$4" space="$5">
                <YStack space="$2" alignItems="center">
                    <Text color="$secondary" fontFamily="$heading" fontSize={32}>JOIN US</Text>
                </YStack>

                <YStack space="$4">
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <NeoInput placeholder="Full Name" value={value} onChangeText={onChange} error={errors.name?.message} />
                        )}
                    />
                    <Controller
                        control={control}
                        name="username"
                        render={({ field: { onChange, value } }) => (
                            <NeoInput placeholder="Username" value={value} onChangeText={onChange} error={errors.username?.message} />
                        )}
                    />
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <NeoInput placeholder="Email" value={value} onChangeText={onChange} error={errors.email?.message} />
                        )}
                    />
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <NeoInput placeholder="Password" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
                        )}
                    />
                    {error ? <Text color="$error" textAlign='center'>{error}</Text> : null}
                </YStack>

                <NeoButton onPress={handleSubmit(onSubmit)} disabled={isSubmitting} variant="secondary">
                    <NeoButtonText>{isSubmitting ? 'Creating...' : 'Register'}</NeoButtonText>
                </NeoButton>

                <XStack justifyContent="center" space="$2">
                    <Text color="$color">Already have an account?</Text>
                    <Text color="$secondary" fontWeight="bold" onPress={() => router.push('/login')}>Login</Text>
                </XStack>
            </YStack>
        </KeyboardAvoidingView>
    );
}
