import React, { useEffect, useState } from 'react';



import {

    ActivityIndicator,

    Alert,

    KeyboardAvoidingView,

    Linking,

    Modal,

    Platform,

    ScrollView,

    StyleSheet,

    Switch,

    Text,

    TextInput,

    TouchableOpacity,

    View,

} from 'react-native';



import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRouter } from 'expo-router';



import { wp, hp } from '../utils/responsive';

import { rf } from '../utils/fonts';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';



const ENV_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const API_BASE_URL = `${ENV_BASE_URL.replace(/\/$/, '')}/api`;



const STORAGE_KEYS = {
    darkMode: 'vajihi_settings_dark_mode',
    notifications: 'vajihi_settings_notifications',
    privacyMode: 'vajihi_settings_privacy_mode',
    language: 'vajihi_settings_language',
    country: 'vajihi_settings_country',
};


const TOKEN_KEYS = ['session_token', 'sessionToken', 'auth_token', 'token'];



type ModalType = 'password' | 'language' | 'socials' | null;



export default function SettingsScreen() {

    const router = useRouter();

    const { logout } = useAuth();
    const { darkMode, theme, setDarkMode } = useTheme();

    const [notifications, setNotifications] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(true);



    const [language, setLanguage] = useState('English');
    const [country, setCountry] = useState('India');

    const [socials, setSocials] = useState({
        instagram_id: '',
        instagram_link: '',
        whatsapp_number: '',
        whatsapp_link: '',
        youtube_id: '',
        youtube_link: '',
    });

    const [modalType, setModalType] = useState<ModalType>(null);

    const [savingPassword, setSavingPassword] = useState(false);



    const [oldPassword, setOldPassword] = useState('');

    const [newPassword, setNewPassword] = useState('');

    const [confirmPassword, setConfirmPassword] = useState('');



    const [loadingSettings, setLoadingSettings] = useState(true);

    const [savingNotificationPreference, setSavingNotificationPreference] = useState(false);



    const getToken = async () => {

        for (const key of TOKEN_KEYS) {

            const value = await AsyncStorage.getItem(key);

            if (value) return value;

        }

        return null;

    };



    const loadSettings = async () => {

        try {

            const [


                savedNotifications,

                savedPrivacyMode,

                savedLanguage,

                savedCountry,

            ] = await Promise.all([


                AsyncStorage.getItem(STORAGE_KEYS.notifications),

                AsyncStorage.getItem(STORAGE_KEYS.privacyMode),

                AsyncStorage.getItem(STORAGE_KEYS.language),

                AsyncStorage.getItem(STORAGE_KEYS.country),

            ]);




            if (savedNotifications !== null) setNotifications(savedNotifications === 'true');

            if (savedPrivacyMode !== null) setPrivacyMode(savedPrivacyMode === 'true');

            if (savedLanguage) setLanguage(savedLanguage);

            if (savedCountry) setCountry(savedCountry);



            // Notification preference is also stored on the server so it can

            // control future push/in-app notifications.

            const token = await getToken();

            if (token && API_BASE_URL) {

                const response = await fetch(`${API_BASE_URL}/settings/preferences`, {

                    headers: {

                        Authorization: `Bearer ${token}`,

                    },

                });



                if (response.ok) {

                    const data = await response.json();



                    if (typeof data.notifications_enabled === 'boolean') {

                        setNotifications(data.notifications_enabled);

                        await AsyncStorage.setItem(

                            STORAGE_KEYS.notifications,

                            String(data.notifications_enabled)

                        );

                    }



                    if (typeof data.privacy_mode === 'boolean') {

                        setPrivacyMode(data.privacy_mode);

                        await AsyncStorage.setItem(

                            STORAGE_KEYS.privacyMode,

                            String(data.privacy_mode)

                        );

                    }

                }

            }
            // Load organisation social media details
            if (API_BASE_URL) {
                try {
                    const aboutResponse = await fetch(
                        `${API_BASE_URL}/about/settings`,
                        token
                            ? {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                            : undefined
                    );

                    if (aboutResponse.ok) {
                        const aboutData = await aboutResponse.json();

                        setSocials({
                            instagram_id: aboutData?.instagram_id || '',
                            instagram_link: aboutData?.instagram_link || '',
                            whatsapp_number: aboutData?.whatsapp_number || '',
                            whatsapp_link: aboutData?.whatsapp_link || '',
                            youtube_id: aboutData?.youtube_id || '',
                            youtube_link: aboutData?.youtube_link || '',
                        });
                    }
                } catch (error) {
                    console.log('Socials load error:', error);
                }
            }

        } catch (error) {

            console.log('Settings load error:', error);

        } finally {

            setLoadingSettings(false);

        }

    };



    useEffect(() => {

        loadSettings();

    }, []);



    const saveLocalSetting = async (key: string, value: boolean) => {

        await AsyncStorage.setItem(key, String(value));

    };



    const updateNotificationPreference = async (value: boolean) => {

        setNotifications(value);

        await saveLocalSetting(STORAGE_KEYS.notifications, value);



        const token = await getToken();

        if (!token || !API_BASE_URL) return;



        try {

            setSavingNotificationPreference(true);



            const response = await fetch(`${API_BASE_URL}/settings/preferences`, {

                method: 'PUT',

                headers: {

                    'Content-Type': 'application/json',

                    Authorization: `Bearer ${token}`,

                },

                body: JSON.stringify({

                    notifications_enabled: value,

                }),

            });



            if (!response.ok) {

                throw new Error('Unable to save notification preference');

            }

        } catch (error) {

            console.log('Notification preference save error:', error);

            Alert.alert(

                'Saved on this device',

                'The notification setting was saved locally, but the server could not be updated.'

            );

        } finally {

            setSavingNotificationPreference(false);

        }

    };



    const updatePrivacyPreference = async (value: boolean) => {

        setPrivacyMode(value);

        await saveLocalSetting(STORAGE_KEYS.privacyMode, value);



        const token = await getToken();

        if (!token || !API_BASE_URL) return;



        try {

            const response = await fetch(`${API_BASE_URL}/settings/preferences`, {

                method: 'PUT',

                headers: {

                    'Content-Type': 'application/json',

                    Authorization: `Bearer ${token}`,

                },

                body: JSON.stringify({

                    privacy_mode: value,

                }),

            });



            if (!response.ok) {

                throw new Error('Unable to save privacy preference');

            }

        } catch (error) {

            console.log('Privacy preference save error:', error);

            Alert.alert(

                'Saved on this device',

                'The privacy setting was saved locally, but the server could not be updated.'

            );

        }

    };



    const updateDarkMode = async (value: boolean) => {

        setDarkMode(value);

        await saveLocalSetting(STORAGE_KEYS.darkMode, value);

    };



    const handleLogout = async () => {

        Alert.alert(

            'Logout',

            'Are you sure you want to logout?',

            [

                {

                    text: 'Cancel',

                    style: 'cancel',

                },

                {

                    text: 'Logout',

                    style: 'destructive',

                    onPress: async () => {

                        await logout();

                        router.replace('/login');

                    },

                },

            ]

        );

    };



    const openContact = async (type: 'email' | 'phone') => {

        const url =

            type === 'email'

                ? 'mailto:vajihiscoutmumbra@gmail.com'

                : 'tel:+919930585875';



        try {

            const supported = await Linking.canOpenURL(url);



            if (!supported) {

                Alert.alert(

                    type === 'email' ? 'Email unavailable' : 'Calling unavailable',

                    type === 'email'

                        ? 'No email application is available on this device.'

                        : 'No calling application is available on this device.'

                );

                return;

            }



            await Linking.openURL(url);

        } catch {

            Alert.alert('Unable to open', 'Please try again on your device.');

        }

    };



    const handleContact = () => {

        Alert.alert(

            'Contact Us',

            'Vajihi Scout Mumbra\n\nEmail: vajihiscoutmumbra@gmail.com\nPhone: +91 9930585875',

            [

                {

                    text: 'Email',

                    onPress: () => openContact('email'),

                },

                {

                    text: 'Call',

                    onPress: () => openContact('phone'),

                },

                {

                    text: 'Close',

                    style: 'cancel',

                },

            ]

        );

    };



    const handleChangePassword = async () => {

        if (!oldPassword.trim()) {

            Alert.alert('Required', 'Please enter your current password.');

            return;

        }



        if (newPassword.length < 6) {

            Alert.alert('Invalid password', 'New password must be at least 6 characters.');

            return;

        }



        if (newPassword !== confirmPassword) {

            Alert.alert('Password mismatch', 'New password and confirm password do not match.');

            return;

        }



        const token = await getToken();



        if (!token) {

            Alert.alert('Session expired', 'Please login again and try changing your password.');

            return;

        }



        try {

            setSavingPassword(true);



            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json',

                    Authorization: `Bearer ${token}`,

                },

                body: JSON.stringify({

                    old_password: oldPassword,

                    new_password: newPassword,

                }),

            });



            const data = await response.json().catch(() => ({}));



            if (!response.ok) {

                throw new Error(data.detail || 'Unable to change password.');

            }



            setOldPassword('');

            setNewPassword('');

            setConfirmPassword('');

            setModalType(null);



            Alert.alert(

                'Password Updated',

                'Your password has been changed successfully.'

            );

        } catch (error: any) {

            Alert.alert(

                'Unable to change password',

                error?.message || 'Something went wrong. Please try again.'

            );

        } finally {

            setSavingPassword(false);

        }

    };



    const selectLanguage = async (value: string) => {

        setLanguage(value);

        await AsyncStorage.setItem(STORAGE_KEYS.language, value);

    };



    const selectCountry = async (value: string) => {

        setCountry(value);

        await AsyncStorage.setItem(STORAGE_KEYS.country, value);

    };



    const resetSettings = () => {

        Alert.alert(

            'Reset Settings',

            'Reset appearance, notification, privacy and language preferences to their defaults?',

            [

                {

                    text: 'Cancel',

                    style: 'cancel',

                },

                {

                    text: 'Reset',

                    style: 'destructive',

                    onPress: async () => {

                        await setDarkMode(false);

                        setNotifications(true);

                        setPrivacyMode(true);

                        setLanguage('English');

                        setCountry('India');



                        await AsyncStorage.multiSet([

                            [STORAGE_KEYS.darkMode, 'false'],

                            [STORAGE_KEYS.notifications, 'true'],

                            [STORAGE_KEYS.privacyMode, 'true'],

                            [STORAGE_KEYS.language, 'English'],

                            [STORAGE_KEYS.country, 'India'],

                        ]);



                        const token = await getToken();



                        if (token && API_BASE_URL) {

                            try {

                                await fetch(`${API_BASE_URL}/settings/preferences`, {

                                    method: 'PUT',

                                    headers: {

                                        'Content-Type': 'application/json',

                                        Authorization: `Bearer ${token}`,

                                    },

                                    body: JSON.stringify({

                                        notifications_enabled: true,

                                        privacy_mode: true,

                                    }),

                                });

                            } catch (error) {

                                console.log('Reset server settings error:', error);

                            }

                        }



                        Alert.alert('Settings Reset', 'Your settings have been restored to default.');

                    },

                },

            ]

        );

    };



    const SettingsCard = ({

        icon,

        title,

        subtitle,

        right,

        onPress,

        danger = false,

    }: {

        icon: any;

        title: string;

        subtitle: string;

        right?: React.ReactNode;

        onPress?: () => void;

        danger?: boolean;

    }) => (

        <TouchableOpacity

            activeOpacity={0.8}

            onPress={onPress}

            disabled={!onPress}

            style={[

                styles.card,

                {

                    backgroundColor: theme.card,

                    borderColor: theme.border,

                },

            ]}

        >

            <View style={styles.cardLeft}>

                <View

                    style={[

                        styles.iconContainer,

                        {

                            backgroundColor: danger

                                ? darkMode

                                    ? '#3b2028'

                                    : '#ffe5ea'

                                : theme.iconBackground,

                        },

                    ]}

                >

                    <Ionicons

                        name={icon}

                        size={22}

                        color={danger ? '#ff4d67' : '#5B4FCE'}

                    />

                </View>



                <View style={{ flex: 1 }}>

                    <Text

                        style={[

                            styles.cardTitle,

                            {

                                color: danger ? '#ff4d67' : theme.title,

                            },

                        ]}

                    >

                        {title}

                    </Text>



                    <Text style={[styles.cardSubtitle, { color: theme.subtitle }]}>

                        {subtitle}

                    </Text>

                </View>

            </View>



            {right}

        </TouchableOpacity>

    );



    if (loadingSettings) {

        return (

            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>

                <ActivityIndicator size="large" color="#5B4FCE" />

                <Text style={[styles.loadingText, { color: theme.subtitle }]}>

                    Loading settings...

                </Text>

            </View>

        );

    }



    return (

        <View style={[styles.container, { backgroundColor: theme.background }]}>

            <LinearGradient

                colors={['#2B145A', '#5B3DF5']}

                style={styles.header}

            >

                <TouchableOpacity

                    style={styles.backButton}

                    onPress={() => router.back()}

                >

                    <Ionicons name="arrow-back" size={26} color="#fff" />

                </TouchableOpacity>



                <Text style={styles.headerTitle}>Settings</Text>



                <TouchableOpacity

                    style={styles.headerAction}

                    onPress={resetSettings}

                >

                    <Ionicons name="sparkles-outline" size={24} color="#fff" />

                </TouchableOpacity>

            </LinearGradient>



            <ScrollView

                showsVerticalScrollIndicator={false}

                contentContainerStyle={{ paddingBottom: 140 }}

            >

                <View style={styles.content}>

                    <Text style={[styles.sectionTitle, { color: theme.section }]}>

                        Appearance

                    </Text>



                    <SettingsCard

                        icon="moon-outline"

                        title="Dark Mode"

                        subtitle={

                            darkMode

                                ? 'Dark theme is enabled'

                                : 'Switch between dark and light theme'

                        }

                        right={

                            <Switch

                                value={darkMode}

                                onValueChange={updateDarkMode}

                                trackColor={{

                                    false: '#ccc',

                                    true: '#5B4FCE',

                                }}

                                thumbColor="#fff"

                            />

                        }

                    />



                    <Text style={[styles.sectionTitle, { color: theme.section }]}>

                        Security

                    </Text>



                    <SettingsCard

                        icon="lock-closed-outline"

                        title="Change Password"

                        subtitle="Update your account password"

                        right={

                            <Ionicons

                                name="chevron-forward"

                                size={22}

                                color={theme.subtitle}

                            />

                        }

                        onPress={() => setModalType('password')}

                    />



                    <SettingsCard

                        icon="shield-checkmark-outline"

                        title="Privacy Mode"

                        subtitle={

                            privacyMode

                                ? 'Private profile information is protected'

                                : 'Privacy mode is disabled'

                        }

                        right={

                            <Switch

                                value={privacyMode}

                                onValueChange={updatePrivacyPreference}

                                trackColor={{

                                    false: '#ccc',

                                    true: '#5B4FCE',

                                }}

                                thumbColor="#fff"

                            />

                        }

                    />



                    <Text style={[styles.sectionTitle, { color: theme.section }]}>

                        Notifications

                    </Text>



                    <SettingsCard

                        icon="notifications-outline"

                        title="Notifications"

                        subtitle={

                            notifications

                                ? 'Receive updates and announcements'

                                : 'Notifications are turned off'

                        }

                        right={

                            savingNotificationPreference ? (

                                <ActivityIndicator size="small" color="#5B4FCE" />

                            ) : (

                                <Switch

                                    value={notifications}

                                    onValueChange={updateNotificationPreference}

                                    trackColor={{

                                        false: '#ccc',

                                        true: '#5B4FCE',

                                    }}

                                    thumbColor="#fff"

                                />

                            )

                        }

                    />



                    <Text style={[styles.sectionTitle, { color: theme.section }]}>

                        Preferences

                    </Text>



                    <SettingsCard

                        icon="language-outline"

                        title="Language & Country"

                        subtitle={`${language} • ${country}`}

                        right={

                            <Ionicons

                                name="chevron-forward"

                                size={22}

                                color={theme.subtitle}

                            />

                        }

                        onPress={() => setModalType('language')}

                    />



                    <Text style={[styles.sectionTitle, { color: theme.section }]}>

                        Support

                    </Text>



                    <SettingsCard

                        icon="call-outline"

                        title="Contact Us"

                        subtitle="Get help and support"

                        right={

                            <Ionicons

                                name="chevron-forward"

                                size={22}

                                color={theme.subtitle}

                            />

                        }

                        onPress={handleContact}

                    />

                    <SettingsCard
                        icon="share-social-outline"
                        title="Socials"
                        subtitle="Follow and connect with our band"
                        right={
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color={theme.subtitle}
                            />
                        }
                        onPress={() => setModalType('socials')}
                    />

                    <SettingsCard

                        icon="people-circle-outline"

                        title="About Our Band"

                        subtitle="Know our legacy, history and organisation"

                        right={

                            <Ionicons

                                name="chevron-forward"

                                size={22}

                                color={theme.subtitle}

                            />

                        }

                        onPress={() => router.push('/about-band')}

                    />



                    <SettingsCard

                        icon="information-circle-outline"

                        title="App Info"

                        subtitle="App version and community details"

                        right={

                            <Ionicons

                                name="chevron-forward"

                                size={22}

                                color={theme.subtitle}

                            />

                        }

                        onPress={() =>

                            Alert.alert(

                                'Vajihi Scout App',

                                'Version 1.0.0\nPremium Band & Community Management App'

                            )

                        }

                    />



                    <Text style={[styles.sectionTitle, { color: theme.section }]}>

                        Account

                    </Text>



                    <SettingsCard

                        icon="log-out-outline"

                        title="Logout"

                        subtitle="Sign out from your account"

                        danger

                        onPress={handleLogout}

                        right={

                            <MaterialIcons

                                name="logout"

                                size={22}

                                color="#ff4d67"

                            />

                        }

                    />

                </View>

            </ScrollView>



            <Modal

                visible={modalType === 'password'}

                transparent

                animationType="slide"

                onRequestClose={() => !savingPassword && setModalType(null)}

            >

                <KeyboardAvoidingView

                    style={styles.modalOverlay}

                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}

                >

                    <View

                        style={[

                            styles.modalCard,

                            {

                                backgroundColor: theme.card,

                            },

                        ]}

                    >

                        <View style={styles.modalHeader}>

                            <View>

                                <Text style={[styles.modalTitle, { color: theme.title }]}>

                                    Change Password

                                </Text>

                                <Text style={[styles.modalSubtitle, { color: theme.subtitle }]}>

                                    Keep your account secure

                                </Text>

                            </View>



                            <TouchableOpacity

                                onPress={() => setModalType(null)}

                                disabled={savingPassword}

                            >

                                <Ionicons

                                    name="close-circle"

                                    size={28}

                                    color={theme.subtitle}

                                />

                            </TouchableOpacity>

                        </View>



                        <TextInput

                            value={oldPassword}

                            onChangeText={setOldPassword}

                            placeholder="Current password"

                            placeholderTextColor={theme.placeholder}

                            secureTextEntry

                            autoCapitalize="none"

                            style={[

                                styles.input,

                                {

                                    backgroundColor: theme.input,

                                    borderColor: theme.inputBorder,

                                    color: theme.title,

                                },

                            ]}

                        />



                        <TextInput

                            value={newPassword}

                            onChangeText={setNewPassword}

                            placeholder="New password (minimum 6 characters)"

                            placeholderTextColor={theme.placeholder}

                            secureTextEntry

                            autoCapitalize="none"

                            style={[

                                styles.input,

                                {

                                    backgroundColor: theme.input,

                                    borderColor: theme.inputBorder,

                                    color: theme.title,

                                },

                            ]}

                        />



                        <TextInput

                            value={confirmPassword}

                            onChangeText={setConfirmPassword}

                            placeholder="Confirm new password"

                            placeholderTextColor={theme.placeholder}

                            secureTextEntry

                            autoCapitalize="none"

                            style={[

                                styles.input,

                                {

                                    backgroundColor: theme.input,

                                    borderColor: theme.inputBorder,

                                    color: theme.title,

                                },

                            ]}

                        />



                        <TouchableOpacity

                            style={styles.primaryButton}

                            onPress={handleChangePassword}

                            disabled={savingPassword}

                        >

                            {savingPassword ? (

                                <ActivityIndicator color="#fff" />

                            ) : (

                                <Text style={styles.primaryButtonText}>

                                    Update Password

                                </Text>

                            )}

                        </TouchableOpacity>



                        <TouchableOpacity

                            style={[

                                styles.secondaryButton,

                                { borderColor: theme.inputBorder },

                            ]}

                            onPress={() => setModalType(null)}

                            disabled={savingPassword}

                        >

                            <Text

                                style={[

                                    styles.secondaryButtonText,

                                    { color: theme.title },

                                ]}

                            >

                                Cancel

                            </Text>

                        </TouchableOpacity>

                    </View>

                </KeyboardAvoidingView>

            </Modal>



            <Modal

                visible={modalType === 'language'}

                transparent

                animationType="slide"

                onRequestClose={() => setModalType(null)}

            >

                <View style={styles.modalOverlay}>

                    <View

                        style={[

                            styles.modalCard,

                            {

                                backgroundColor: theme.card,

                            },

                        ]}

                    >

                        <View style={styles.modalHeader}>

                            <View>

                                <Text style={[styles.modalTitle, { color: theme.title }]}>

                                    Language & Country

                                </Text>

                                <Text style={[styles.modalSubtitle, { color: theme.subtitle }]}>

                                    Choose your preferred settings

                                </Text>

                            </View>



                            <TouchableOpacity onPress={() => setModalType(null)}>

                                <Ionicons

                                    name="close-circle"

                                    size={28}

                                    color={theme.subtitle}

                                />

                            </TouchableOpacity>

                        </View>



                        <Text style={[styles.fieldLabel, { color: theme.title }]}>

                            Language

                        </Text>



                        {['English', 'Hindi', 'Gujarati', 'Urdu'].map((item) => (

                            <TouchableOpacity

                                key={item}

                                style={[

                                    styles.optionRow,

                                    {

                                        backgroundColor:

                                            language === item

                                                ? darkMode

                                                    ? '#2d2650'

                                                    : '#f1edff'

                                                : theme.input,

                                        borderColor:

                                            language === item

                                                ? '#5B4FCE'

                                                : theme.inputBorder,

                                    },

                                ]}

                                onPress={() => selectLanguage(item)}

                            >

                                <Text

                                    style={[

                                        styles.optionText,

                                        {

                                            color: theme.title,

                                        },

                                    ]}

                                >

                                    {item}

                                </Text>



                                {language === item && (

                                    <Ionicons

                                        name="checkmark-circle"

                                        size={22}

                                        color="#5B4FCE"

                                    />

                                )}

                            </TouchableOpacity>

                        ))}



                        <Text style={[styles.fieldLabel, { color: theme.title }]}>

                            Country

                        </Text>



                        {['India'].map((item) => (

                            <TouchableOpacity

                                key={item}

                                style={[

                                    styles.optionRow,

                                    {

                                        backgroundColor: theme.input,

                                        borderColor: theme.inputBorder,

                                    },

                                ]}

                                onPress={() => selectCountry(item)}

                            >

                                <Text style={[styles.optionText, { color: theme.title }]}>

                                    🇮🇳 {item}

                                </Text>



                                {country === item && (

                                    <Ionicons

                                        name="checkmark-circle"

                                        size={22}

                                        color="#5B4FCE"

                                    />

                                )}

                            </TouchableOpacity>

                        ))}



                        <View

                            style={[

                                styles.infoBox,

                                {

                                    backgroundColor: darkMode ? '#20202d' : '#f7f5ff',

                                },

                            ]}

                        >

                            <Ionicons

                                name="information-circle-outline"

                                size={19}

                                color="#5B4FCE"

                            />

                            <Text style={[styles.infoText, { color: theme.subtitle }]}>

                                Your selection is saved for your account on this device.

                            </Text>

                        </View>



                        <TouchableOpacity

                            style={styles.primaryButton}

                            onPress={() => setModalType(null)}

                        >

                            <Text style={styles.primaryButtonText}>Done</Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>

            <Modal
                visible={modalType === 'socials'}
                transparent
                animationType="slide"
                onRequestClose={() => setModalType(null)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalCard,
                            {
                                backgroundColor: theme.card,
                            },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <View>
                                <Text
                                    style={[
                                        styles.modalTitle,
                                        { color: theme.title },
                                    ]}
                                >
                                    Socials
                                </Text>

                                <Text
                                    style={[
                                        styles.modalSubtitle,
                                        { color: theme.subtitle },
                                    ]}
                                >
                                    Follow and connect with Vajihi Scout Mumbra
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setModalType(null)}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={28}
                                    color={theme.subtitle}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Instagram */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!socials.instagram_link}
                            onPress={() => {
                                if (socials.instagram_link) {
                                    Linking.openURL(socials.instagram_link);
                                }
                            }}
                            style={[
                                styles.socialRow,
                                {
                                    backgroundColor: theme.input,
                                    borderColor: theme.inputBorder,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.socialIcon,
                                    { backgroundColor: '#FDE7F3' },
                                ]}
                            >
                                <Ionicons
                                    name="logo-instagram"
                                    size={25}
                                    color="#E1306C"
                                />
                            </View>

                            <View style={styles.socialInfo}>
                                <Text
                                    style={[
                                        styles.socialTitle,
                                        { color: theme.title },
                                    ]}
                                >
                                    Instagram
                                </Text>

                                <Text
                                    style={[
                                        styles.socialId,
                                        { color: theme.subtitle },
                                    ]}
                                >
                                    {socials.instagram_id || 'Not added'}
                                </Text>

                                {socials.instagram_link ? (
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.socialLink,
                                            { color: '#5B4FCE' },
                                        ]}
                                    >
                                        {socials.instagram_link}
                                    </Text>
                                ) : null}
                            </View>

                            {socials.instagram_link ? (
                                <Ionicons
                                    name="open-outline"
                                    size={20}
                                    color="#5B4FCE"
                                />
                            ) : null}
                        </TouchableOpacity>

                        {/* WhatsApp */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!socials.whatsapp_link}
                            onPress={() => {
                                if (socials.whatsapp_link) {
                                    Linking.openURL(socials.whatsapp_link);
                                }
                            }}
                            style={[
                                styles.socialRow,
                                {
                                    backgroundColor: theme.input,
                                    borderColor: theme.inputBorder,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.socialIcon,
                                    { backgroundColor: '#E4F8EA' },
                                ]}
                            >
                                <Ionicons
                                    name="logo-whatsapp"
                                    size={25}
                                    color="#25D366"
                                />
                            </View>

                            <View style={styles.socialInfo}>
                                <Text
                                    style={[
                                        styles.socialTitle,
                                        { color: theme.title },
                                    ]}
                                >
                                    WhatsApp
                                </Text>

                                <Text
                                    style={[
                                        styles.socialId,
                                        { color: theme.subtitle },
                                    ]}
                                >
                                    {socials.whatsapp_number || 'Not added'}
                                </Text>

                                {socials.whatsapp_link ? (
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.socialLink,
                                            { color: '#5B4FCE' },
                                        ]}
                                    >
                                        {socials.whatsapp_link}
                                    </Text>
                                ) : null}
                            </View>

                            {socials.whatsapp_link ? (
                                <Ionicons
                                    name="open-outline"
                                    size={20}
                                    color="#5B4FCE"
                                />
                            ) : null}
                        </TouchableOpacity>

                        {/* YouTube */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={!socials.youtube_link}
                            onPress={() => {
                                if (socials.youtube_link) {
                                    Linking.openURL(socials.youtube_link);
                                }
                            }}
                            style={[
                                styles.socialRow,
                                {
                                    backgroundColor: theme.input,
                                    borderColor: theme.inputBorder,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.socialIcon,
                                    { backgroundColor: '#FFE7E7' },
                                ]}
                            >
                                <Ionicons
                                    name="logo-youtube"
                                    size={25}
                                    color="#FF0000"
                                />
                            </View>

                            <View style={styles.socialInfo}>
                                <Text
                                    style={[
                                        styles.socialTitle,
                                        { color: theme.title },
                                    ]}
                                >
                                    YouTube
                                </Text>

                                <Text
                                    style={[
                                        styles.socialId,
                                        { color: theme.subtitle },
                                    ]}
                                >
                                    {socials.youtube_id || 'Not added'}
                                </Text>

                                {socials.youtube_link ? (
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.socialLink,
                                            { color: '#5B4FCE' },
                                        ]}
                                    >
                                        {socials.youtube_link}
                                    </Text>
                                ) : null}
                            </View>

                            {socials.youtube_link ? (
                                <Ionicons
                                    name="open-outline"
                                    size={20}
                                    color="#5B4FCE"
                                />
                            ) : null}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setModalType(null)}
                        >
                            <Text style={styles.primaryButtonText}>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>

    );

}



const styles = StyleSheet.create({

    container: {

        flex: 1,

    },



    loadingContainer: {

        flex: 1,

        justifyContent: 'center',

        alignItems: 'center',

    },



    loadingText: {

        marginTop: hp(1.5),

        fontSize: rf(14),

    },



    header: {

        paddingTop: hp(8),

        paddingBottom: hp(4),

        paddingHorizontal: wp(5),

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'center',

        borderBottomLeftRadius: wp(8),

        borderBottomRightRadius: wp(8),

    },



    backButton: {

        width: wp(11),

        height: wp(11),

        borderRadius: wp(5.5),

        backgroundColor: 'rgba(255,255,255,0.18)',

        justifyContent: 'center',

        alignItems: 'center',

    },



    headerAction: {

        width: wp(11),

        height: wp(11),

        borderRadius: wp(5.5),

        backgroundColor: 'rgba(255,255,255,0.18)',

        justifyContent: 'center',

        alignItems: 'center',

    },



    headerTitle: {

        fontSize: rf(26),

        fontWeight: '800',

        color: '#fff',

    },



    content: {

        padding: wp(5),

    },



    sectionTitle: {

        fontSize: rf(18),

        fontWeight: '700',

        marginBottom: hp(1.5),

        marginTop: hp(1),

    },



    card: {

        borderRadius: wp(7),

        borderWidth: 1,

        padding: wp(5),

        marginBottom: hp(2),

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'center',

        shadowColor: '#000',

        shadowOffset: {

            width: 0,

            height: 3,

        },

        shadowOpacity: 0.08,

        shadowRadius: 8,

        elevation: 4,

    },



    cardLeft: {

        flexDirection: 'row',

        alignItems: 'center',

        flex: 1,

    },



    iconContainer: {

        width: wp(13),

        height: wp(13),

        borderRadius: wp(4),

        justifyContent: 'center',

        alignItems: 'center',

        marginRight: wp(4),

    },



    cardTitle: {

        fontSize: rf(15),

        fontWeight: '700',

    },



    cardSubtitle: {

        marginTop: hp(0.5),

        fontSize: rf(12),

        flexShrink: 1,

    },



    modalOverlay: {

        flex: 1,

        backgroundColor: 'rgba(0,0,0,0.55)',

        justifyContent: 'flex-end',

    },



    modalCard: {

        width: '100%',

        borderTopLeftRadius: wp(7),

        borderTopRightRadius: wp(7),

        padding: wp(5),

        maxHeight: '92%',

    },



    modalHeader: {

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'flex-start',

        marginBottom: hp(2.5),

    },



    modalTitle: {

        fontSize: rf(21),

        fontWeight: '800',

    },



    modalSubtitle: {

        marginTop: hp(0.5),

        fontSize: rf(12),

    },



    input: {

        minHeight: hp(6.5),

        borderWidth: 1,

        borderRadius: wp(4),

        paddingHorizontal: wp(4),

        fontSize: rf(14),

        marginBottom: hp(1.5),

    },



    primaryButton: {

        minHeight: hp(6.5),

        borderRadius: wp(4),

        backgroundColor: '#5B4FCE',

        justifyContent: 'center',

        alignItems: 'center',

        marginTop: hp(1),

    },



    primaryButtonText: {

        color: '#fff',

        fontSize: rf(15),

        fontWeight: '800',

    },



    secondaryButton: {

        minHeight: hp(6.5),

        borderRadius: wp(4),

        borderWidth: 1,

        justifyContent: 'center',

        alignItems: 'center',

        marginTop: hp(1.2),

    },



    secondaryButtonText: {

        fontSize: rf(15),

        fontWeight: '700',

    },



    fieldLabel: {

        fontSize: rf(14),

        fontWeight: '700',

        marginBottom: hp(1),

        marginTop: hp(0.5),

    },



    optionRow: {

        minHeight: hp(6),

        borderWidth: 1,

        borderRadius: wp(4),

        paddingHorizontal: wp(4),

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: hp(1),

    },



    optionText: {

        fontSize: rf(14),

        fontWeight: '600',

    },

    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: wp(4.5),
        padding: wp(3.2),
        marginBottom: hp(1.5),
    },

    socialIcon: {
        width: wp(13),
        height: wp(13),
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3.5),
    },

    socialInfo: {
        flex: 1,
        minWidth: 0,
    },

    socialTitle: {
        fontSize: rf(15),
        fontWeight: '800',
    },

    socialId: {
        fontSize: rf(13),
        marginTop: hp(0.3),
    },

    socialLink: {
        fontSize: rf(10.5),
        marginTop: hp(0.3),
    },

    infoBox: {

        flexDirection: 'row',

        alignItems: 'center',

        gap: wp(2),

        padding: wp(3.5),

        borderRadius: wp(4),

        marginTop: hp(1),

    },



    infoText: {

        flex: 1,

        fontSize: rf(12),

        lineHeight: rf(18),

    },

}) as any;
