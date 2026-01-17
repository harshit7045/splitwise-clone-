import { Button, styled, Text } from 'tamagui';

export const NeoButton = styled(Button, {
    backgroundColor: '$primary',
    borderRadius: 12, // slightly rounded for "squircle" feel
    borderWidth: 2,
    borderColor: '$borderColor',
    paddingVertical: '$3',
    shadowColor: '$color',
    shadowOffset: { width: 4, height: 4 }, // Hard shadow
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0, // Disable native android elevation to keep hard shadow look manually if needed (workaround)
    pressStyle: {
        shadowOffset: { width: 0, height: 0 },
        transform: [{ translateX: 4 }, { translateY: 4 }],
    },

    variants: {
        variant: {
            primary: {
                backgroundColor: '$primary',
                color: '#000', // Text color black for contrast on high-vis green
            },
            secondary: {
                backgroundColor: '$secondary',
                color: '#FFF',
            },
            outline: {
                backgroundColor: 'transparent',
                borderColor: '$primary',
                color: '$primary',
                shadowOffset: { width: 0, height: 0 }, // no hard shadow for outline
            },
        },
    },
    defaultVariants: {
        variant: 'primary',
    },
});

export const NeoButtonText = styled(Text, {
    color: '#000',
    fontFamily: '$heading',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
});
