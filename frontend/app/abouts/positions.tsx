import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type AboutContent = {
    content_id: string;
    section_type: string;
    title: string;
    subtitle?: string | null;
    content?: string | null;
    details?: Record<string, any> | null;
    image?: string | null;
    display_order: number;
    active: boolean;
    created_at?: string;
    updated_at?: string;
};

const SECTION_TYPE = 'positions';

const SECTION = {
    title: 'Members & Positions',
    subtitle: 'List of members and their respective positions',
    icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    color: '#F97316',
};

const ENV_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API_BASE_URL = ENV_BASE_URL.endsWith('/api')
    ? ENV_BASE_URL
    : `${ENV_BASE_URL.replace(/\/$/, '')}/api`;

const getToken = async (): Promise<string | null> => {
    const keys = ['session_token', 'sessionToken', 'auth_token', 'token'];

    for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) return value;
    }

    return null;
};

const formatKey = (key: string) =>
    key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';

    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => formatValue(item))
            .filter(Boolean)
            .join(', ');
    }

    return JSON.stringify(value, null, 2);
};

export default function MembersPositionsScreen() {
    const router = useRouter();

    const [items, setItems] = useState<AboutContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadContent = useCallback(async () => {
        try {
            setError('');

            const token = await getToken();

            const headers: Record<string, string> = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(
                `${API_BASE_URL}/about/content?section_type=${SECTION_TYPE}`,
                {
                    method: 'GET',
                    headers,
                    credentials: 'include',
                },
            );

            let data: any = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    `Request failed with status ${response.status}`,
                );
            }

            const sorted = (Array.isArray(data) ? data : []).sort(
                (a: AboutContent, b: AboutContent) => {
                    if (a.display_order !== b.display_order) {
                        return a.display_order - b.display_order;
                    }

                    return (a.created_at || '').localeCompare(
                        b.created_at || '',
                    );
                },
            );

            setItems(sorted);
        } catch (err: any) {
            console.error(`Failed to load ${SECTION_TYPE} About content:`, err);
            setError(
                err?.message ||
                `Unable to load ${SECTION.title.toLowerCase()} information.`,
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadContent();
    };

    const renderDetails = (details?: Record<string, any> | null) => {
        if (!details || Object.keys(details).length === 0) return null;

        return (
            <View style={styles.detailsBox}>
                {Object.entries(details).map(([key, value]) => {
                    const formatted = formatValue(value);

                    if (!formatted) return null;

                    return (
                        <View key={key} style={styles.detailRow}>
                            <Text style={styles.detailKey}>{formatKey(key)}</Text>
                            <Text style={styles.detailValue}>{formatted}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderItem = (item: AboutContent, index: number) => (
        <View key={item.content_id} style={styles.contentCard}>
            <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{index + 1}</Text>
            </View>

            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.contentImage}
                    resizeMode="cover"
                />
            ) : null}

            <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                    <View style={styles.titleAccent} />
                    <View style={styles.titleContainer}>
                        <Text style={styles.contentTitle}>{item.title}</Text>

                        {item.subtitle ? (
                            <Text style={styles.contentSubtitle}>
                                {item.subtitle}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {item.content ? (
                    <Text style={styles.contentText}>{item.content}</Text>
                ) : null}

                {renderDetails(item.details)}
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#2B145A', '#5B3DF5']}
                    style={styles.loadingContainer}
                >
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>
                        Loading {SECTION.title}...
                    </Text>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={SECTION.color}
                    />
                }
            >
                <LinearGradient
                    colors={['#2B145A', '#5B3DF5']}
                    style={styles.header}
                >
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={27}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <View style={styles.headerIcon}>
                            <Ionicons
                                name={SECTION.icon}
                                size={23}
                                color="#fff"
                            />
                        </View>
                    </View>

                    <View style={styles.headerContent}>
                        <View
                            style={[
                                styles.headerIconLarge,
                                { backgroundColor: 'rgba(255,255,255,0.15)' },
                            ]}
                        >
                            <Ionicons
                                name={SECTION.icon}
                                size={36}
                                color="#fff"
                            />
                        </View>

                        <Text style={styles.headerTitle}>
                            {SECTION.title}
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            {SECTION.subtitle}
                        </Text>
                    </View>

                    <View style={styles.wave} />
                </LinearGradient>

                <View style={styles.pageContent}>
                    {error ? (
                        <View style={styles.errorCard}>
                            <View style={styles.errorIcon}>
                                <Ionicons
                                    name="cloud-offline-outline"
                                    size={28}
                                    color="#EF4444"
                                />
                            </View>

                            <View style={styles.errorTextContainer}>
                                <Text style={styles.errorTitle}>
                                    Unable to load content
                                </Text>
                                <Text style={styles.errorMessage}>
                                    {error}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={loadContent}
                                activeOpacity={0.85}
                            >
                                <Ionicons
                                    name="refresh-outline"
                                    size={18}
                                    color="#fff"
                                />
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : items.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View
                                style={[
                                    styles.emptyIcon,
                                    {
                                        backgroundColor: `${SECTION.color}18`,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={SECTION.icon}
                                    size={40}
                                    color={SECTION.color}
                                />
                            </View>

                            <Text style={styles.emptyTitle}>
                                No information available yet
                            </Text>

                            <Text style={styles.emptyText}>
                                Content for {SECTION.title.toLowerCase()} has
                                not been added yet. Please check again later.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.introCard}>
                                <View
                                    style={[
                                        styles.introIcon,
                                        {
                                            backgroundColor: `${SECTION.color}18`,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={SECTION.icon}
                                        size={25}
                                        color={SECTION.color}
                                    />
                                </View>

                                <View style={styles.introText}>
                                    <Text style={styles.introTitle}>
                                        {items.length}{' '}
                                        {items.length === 1
                                            ? 'entry'
                                            : 'entries'}
                                    </Text>

                                    <Text style={styles.introSubtitle}>
                                        Information maintained by Vajihi
                                        Scout Mumbra
                                    </Text>
                                </View>
                            </View>

                            {items.map(renderItem)}
                        </>
                    )}
                </View>

                <View style={styles.footer}>
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={18}
                        color="#8D85A5"
                    />
                    <Text style={styles.footerText}>
                        Vajihi Scout Mumbra
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F6FB',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        marginTop: 14,
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    header: {
        minHeight: 245,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
        overflow: 'hidden',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },

    headerIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },

    headerContent: {
        alignItems: 'center',
        marginTop: 18,
    },

    headerIconLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 27,
        fontWeight: '800',
        textAlign: 'center',
    },

    headerSubtitle: {
        marginTop: 7,
        color: 'rgba(255,255,255,0.76)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        maxWidth: 360,
    },

    wave: {
        position: 'absolute',
        bottom: -42,
        left: -20,
        right: -20,
        height: 75,
        borderRadius: 50,
        backgroundColor: '#F7F6FB',
    },

    pageContent: {
        paddingHorizontal: 16,
        paddingTop: 2,
        paddingBottom: 20,
    },

    introCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#ECE9F4',
        shadowColor: '#2B145A',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },

    introIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    introText: {
        flex: 1,
    },

    introTitle: {
        color: '#241A3A',
        fontSize: 17,
        fontWeight: '800',
    },

    introSubtitle: {
        marginTop: 3,
        color: '#817995',
        fontSize: 12.5,
        lineHeight: 18,
    },

    contentCard: {
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ECE9F4',
        shadowColor: '#2B145A',
        shadowOpacity: 0.055,
        shadowRadius: 11,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },

    numberBadge: {
        position: 'absolute',
        zIndex: 3,
        top: 12,
        right: 12,
        minWidth: 30,
        height: 30,
        paddingHorizontal: 8,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(43,20,90,0.88)',
    },

    numberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    contentImage: {
        width: '100%',
        height: 190,
        backgroundColor: '#EFEDF5',
    },

    cardBody: {
        padding: 17,
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    titleAccent: {
        width: 5,
        minHeight: 39,
        borderRadius: 3,
        backgroundColor: SECTION.color,
        marginRight: 11,
    },

    titleContainer: {
        flex: 1,
        paddingRight: 26,
    },

    contentTitle: {
        color: '#241A3A',
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '800',
    },

    contentSubtitle: {
        marginTop: 4,
        color: SECTION.color,
        fontSize: 12.5,
        lineHeight: 18,
        fontWeight: '600',
    },

    contentText: {
        marginTop: 14,
        color: '#625B73',
        fontSize: 14,
        lineHeight: 22,
    },

    detailsBox: {
        marginTop: 14,
        backgroundColor: '#F8F7FB',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ECE9F4',
    },

    detailRow: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EAE6F1',
    },

    detailKey: {
        color: '#5B3DF5',
        fontSize: 11.5,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.35,
    },

    detailValue: {
        marginTop: 4,
        color: '#4D465D',
        fontSize: 13.5,
        lineHeight: 20,
    },

    errorCard: {
        backgroundColor: '#FFF7F7',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F7D4D4',
        flexDirection: 'row',
        alignItems: 'center',
    },

    errorIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#FEECEC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    errorTextContainer: {
        flex: 1,
    },

    errorTitle: {
        color: '#991B1B',
        fontSize: 15,
        fontWeight: '800',
    },

    errorMessage: {
        marginTop: 3,
        color: '#B45353',
        fontSize: 12,
        lineHeight: 17,
    },

    retryButton: {
        marginLeft: 8,
        minHeight: 38,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#5B3DF5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    retryText: {
        marginLeft: 5,
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ECE9F4',
        shadowColor: '#2B145A',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },

    emptyIcon: {
        width: 82,
        height: 82,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyTitle: {
        marginTop: 18,
        color: '#2A213B',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },

    emptyText: {
        marginTop: 8,
        color: '#817995',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 30,
    },

    footerText: {
        marginLeft: 7,
        color: '#8D85A5',
        fontSize: 12,
        fontWeight: '600',
    },
});
