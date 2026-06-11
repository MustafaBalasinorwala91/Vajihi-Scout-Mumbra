import { wp, hp } from '../utils/responsive';
import { rf } from '../utils/fonts';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { logout } = useAuth();

    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(true);

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

    const SettingsCard = ({
        icon,
        title,
        subtitle,
        right,
        onPress,
        danger = false,
    }: any) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.card}
        >
            <View style={styles.cardLeft}>
                <View
                    style={[
                        styles.iconContainer,
                        danger && { backgroundColor: '#ffe5ea' },
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
                            danger && { color: '#ff4d67' },
                        ]}
                    >
                        {title}
                    </Text>

                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
            </View>

            {right}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
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

                <TouchableOpacity>
                    <Ionicons name="sparkles-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Appearance</Text>

                    <SettingsCard
                        icon="moon-outline"
                        title="Dark Mode"
                        subtitle="Switch between dark and light theme"
                        right={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{
                                    false: '#ccc',
                                    true: '#5B4FCE',
                                }}
                            />
                        }
                    />

                    <Text style={styles.sectionTitle}>Security</Text>

                    <SettingsCard
                        icon="lock-closed-outline"
                        title="Change Password"
                        subtitle="Update your account password"
                        right={
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#999"
                            />
                        }
                        onPress={() =>
                            Alert.alert('Coming Soon', 'Password change feature coming soon')
                        }
                    />

                    <SettingsCard
                        icon="shield-checkmark-outline"
                        title="Privacy Mode"
                        subtitle="Protect your profile information"
                        right={
                            <Switch
                                value={privacyMode}
                                onValueChange={setPrivacyMode}
                                trackColor={{
                                    false: '#ccc',
                                    true: '#5B4FCE',
                                }}
                            />
                        }
                    />

                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <SettingsCard
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Receive updates and announcements"
                        right={
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{
                                    false: '#ccc',
                                    true: '#5B4FCE',
                                }}
                            />
                        }
                    />

                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <SettingsCard
                        icon="language-outline"
                        title="Language & Country"
                        subtitle="English • India"
                        right={
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#999"
                            />
                        }
                        onPress={() =>
                            Alert.alert('Coming Soon', 'Language selection feature coming soon')
                        }
                    />

                    <Text style={styles.sectionTitle}>Support</Text>

                    <SettingsCard
                        icon="call-outline"
                        title="Contact Us"
                        subtitle="Get help and support"
                        right={
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#999"
                            />
                        }
                        onPress={() =>
                            Alert.alert(
                                'Contact Us',
                                'Email: vajihiscoutmumbra@gmail.com\nPhone: +91 9930585875'
                            )
                        }
                    />

                    <SettingsCard
                        icon="people-circle-outline"
                        title="About Our Band"
                        subtitle="Know our legacy, history and organisation"
                        right={
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color="#999"
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
                                color="#999"
                            />
                        }
                        onPress={() =>
                            Alert.alert(
                                'Vajihi Scout App',
                                'Version 1.0.0\nPremium Band & Community Management App'
                            )
                        }
                    />

                    <Text style={styles.sectionTitle}>Account</Text>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
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
        color: '#1a1a2e',

        marginBottom: hp(1.5),
        marginTop: hp(1),
    },

    card: {
        backgroundColor: '#fff',

        borderRadius: wp(7),

        borderWidth: 1,
        borderColor: '#F3F0FF',

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

        backgroundColor: '#f1edff',

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: wp(4),
    },

    cardTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        color: '#1a1a2e',
    },

    cardSubtitle: {
        color: '#777',

        marginTop: hp(0.5),

        fontSize: rf(12),

        flexShrink: 1,
    },
});