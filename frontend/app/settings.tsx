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

                <View>
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
                colors={['#4B2CCF', '#6C4DFF']}
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
                                'Email: support@vajihiscout.com\nPhone: +91 9876543210'
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
        paddingTop: 60,
        paddingBottom: 35,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },

    content: {
        padding: 18,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 14,
        marginTop: 10,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 18,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
    },

    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#f1edff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a2e',
    },

    cardSubtitle: {
        color: '#777',
        marginTop: 5,
        fontSize: 13,
    },
});