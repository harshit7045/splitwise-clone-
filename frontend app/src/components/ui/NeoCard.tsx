import { styled, YStack } from 'tamagui';

export const NeoCard = styled(YStack, {
    backgroundColor: '#2B2D31',
    borderRadius: 16,
    padding: '$4',
    borderWidth: 1,
    borderColor: '$borderColor',

    variants: {
        elevated: {
            true: {
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 0,
            }
        },
        bordered: {
            true: {
                borderWidth: 2,
                borderColor: '$primary'
            }
        }
    }
});
