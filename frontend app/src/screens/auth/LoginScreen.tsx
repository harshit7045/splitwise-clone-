import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, Text, XStack, useTheme } from 'tamagui';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NeoInput } from '../../components/ui/NeoInput';
import { NeoButton, NeoButtonText } from '../../components/ui/NeoButton';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { login } = useAuth();
    const [error, setError] = useState('');

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await client.post('/users/login/', data);
            await login(response.data, response.data.token);
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error(err);
            setError('Invalid credentials');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: '#1E1E1E' }}
        >
            <YStack flex={1} justifyContent="center" padding="$4" space="$5">
                <YStack space="$2" alignItems="center">
                    <Text color="$primary" fontFamily="$heading" fontSize={48} textAlign="center"
                        textShadowColor="$primary" textShadowRadius={10}>
                        SPLIT-Z
                    </Text>
                    <Text color="$color" opacity={0.7} fontFamily="$body">Neo-Social Finance</Text>
                </YStack>

                <YStack space="$4">
                    <Controller
                        control={control}
                        name="username"
                        render={({ field: { onChange, value } }) => (
                            <NeoInput
                                placeholder="Username"
                                value={value}
                                onChangeText={onChange}
                                error={errors.username?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <NeoInput
                                placeholder="Password"
                                value={value}
                                onChangeText={onChange}
                                secureTextEntry
                                error={errors.password?.message}
                            />
                        )}
                    />

                    {error ? <Text color="$error" textAlign='center'>{error}</Text> : null}
                </YStack>

                <NeoButton onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
                    <NeoButtonText>{isSubmitting ? 'Logging In...' : 'Login'}</NeoButtonText>
                </NeoButton>

                <XStack justifyContent="center" space="$2">
                    <Text color="$color">New here?</Text>
                    <Text color="$primary" fontWeight="bold" onPress={() => router.push('/register')}>Create Account</Text>
                </XStack>
            </YStack>
        </KeyboardAvoidingView>
    );
}
