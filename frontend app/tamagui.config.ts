import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';

const headingFont = createInterFont({
    size: {
        6: 15,
        7: 28,
        8: 38,
        9: 58,
        10: 64,
    },
    transform: {
        6: 'uppercase',
        7: 'none',
    },
    weight: {
        6: '400',
        7: '700',
    },
    color: {
        6: '$colorFocus',
        7: '$color',
    },
    letterSpacing: {
        5: 2,
        6: 1,
        7: 0,
        8: -1,
        9: -2,
    },
    face: {
        700: { normal: 'InterBold' },
    },
});

const bodyFont = createInterFont(
    {
        face: {
            700: { normal: 'InterBold' },
        },
    },
    {
        sizeSize: (size) => Math.round(size * 1.1),
        sizeLineHeight: (size) => Math.round(size * 1.1 + (size > 20 ? 10 : 10)),
    }
);

const appConfig = createTamagui({
    themes: {
        dark: {
            background: '#1E1E1E',
            color: '#FFFFFF',
            primary: '#D0FF48', // Acid Green
            secondary: '#8A2BE2', // Hyper Violet
            error: '#FF4D4D',
            borderColor: '#36393F'
        },
        light: {
            background: '#FFFFFF',
            color: '#000000',
            primary: '#D0FF48',
            secondary: '#8A2BE2',
            error: '#FF4D4D',
            borderColor: '#E5E5E5'
        }
    },
    defaultTheme: 'dark',
    shouldAddPrefersColorThemes: false,
    themeClassNameOnRoot: false,
    shorthands,
    fonts: {
        heading: headingFont,
        body: bodyFont,
    },
    tokens,
});

export type AppConfig = typeof appConfig;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig { }
}

export default appConfig;
