import { Input, styled, YStack, Text } from 'tamagui';

export const StyledInput = styled(Input, {
    backgroundColor: '#2B2D31',
    borderWidth: 2,
    borderColor: '$borderColor',
    borderRadius: 8,
    padding: '$3',
    color: '$color',
    fontSize: 16,
    fontFamily: '$body',
    height: 50,

    focusStyle: {
        borderColor: '$primary',
        shadowColor: '$primary',
        shadowRadius: 8,
        shadowOpacity: 0.5,
    },
});

export const NeoInput = ({ label, error, ...props }: any) => (
    <YStack space="$2" width="100%">
        {label && (
            <Text color="$color" fontFamily="$body" fontSize={14} opacity={0.8}>
                {label}
            </Text>
        )}
        <StyledInput {...props} />
        {error && (
            <Text color="$error" fontSize={12}>
                {error}
            </Text>
        )}
    </YStack>
);
