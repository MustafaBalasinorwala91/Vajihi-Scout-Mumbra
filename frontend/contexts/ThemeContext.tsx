import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = 'vajihi_settings_dark_mode';

export interface AppTheme {
    background: string;
    card: string;
    title: string;
    subtitle: string;
    section: string;
    border: string;
    iconBackground: string;
    divider: string;
    input: string;
    inputBorder: string;
    placeholder: string;
    surface: string;
    tabBar: string;
    tabBorder: string;
    overlay: string;
}

interface ThemeContextType {
    darkMode: boolean;
    theme: AppTheme;
    loadingTheme: boolean;
    setDarkMode: (value: boolean) => Promise<void>;
    toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [darkMode, setDarkModeState] = useState(false);
    const [loadingTheme, setLoadingTheme] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadTheme = async () => {
            try {
                const saved = await AsyncStorage.getItem(DARK_MODE_KEY);
                if (mounted && saved !== null) {
                    setDarkModeState(saved === 'true');
                }
            } catch (error) {
                console.log('Theme load error:', error);
            } finally {
                if (mounted) setLoadingTheme(false);
            }
        };

        loadTheme();

        return () => {
            mounted = false;
        };
    }, []);

    const setDarkMode = useCallback(async (value: boolean) => {
        setDarkModeState(value);
        try {
            await AsyncStorage.setItem(DARK_MODE_KEY, String(value));
        } catch (error) {
            console.log('Theme save error:', error);
        }
    }, []);

    const toggleDarkMode = useCallback(async () => {
        await setDarkMode(!darkMode);
    }, [darkMode, setDarkMode]);

    const theme = useMemo<AppTheme>(() => ({
        background: darkMode ? '#101018' : '#f4f4f4',
        card: darkMode ? '#1b1b27' : '#ffffff',
        title: darkMode ? '#ffffff' : '#1a1a2e',
        subtitle: darkMode ? '#b8b8c7' : '#777777',
        section: darkMode ? '#ffffff' : '#1a1a2e',
        border: darkMode ? '#2d2d3d' : '#F3F0FF',
        iconBackground: darkMode ? '#292440' : '#f1edff',
        divider: darkMode ? '#30303e' : '#eeeeee',
        input: darkMode ? '#242431' : '#f7f7fa',
        inputBorder: darkMode ? '#3a3a4a' : '#e6e6ee',
        placeholder: darkMode ? '#8e8e9e' : '#999999',
        surface: darkMode ? '#15151f' : '#fafafa',
        tabBar: darkMode ? '#15151f' : '#ffffff',
        tabBorder: darkMode ? '#2d2d3d' : '#e8e8e8',
        overlay: darkMode ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.35)',
    }), [darkMode]);

    return (
        <ThemeContext.Provider
            value={{ darkMode, theme, loadingTheme, setDarkMode, toggleDarkMode }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
