import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
    Ionicons,
    MaterialCommunityIcons,
    FontAwesome5,
} from '@expo/vector-icons';

import { useRouter } from 'expo-router';

export default function AboutBandScreen() {

    const router = useRouter();

    const stats = [

        {
            icon: 'calendar',
            value: '1972',
            label: 'Established Year',
            color: '#7C4DFF',
        },
        {
            icon: 'shield-checkmark',
            value: '52+',
            label: 'Years Completed',
            color: '#22C55E',
        },
        {
            icon: 'musical-notes',
            value: '15',
            label: 'Types of Instruments',
            color: '#F59E0B',
        },
        {
            icon: 'drum',
            value: '32',
            label: 'Marches We Play',
            color: '#8B5CF6',
        },
        {
            icon: 'shirt',
            value: '8',
            label: 'Types of Uniforms',
            color: '#06B6D4',
        },
        {
            icon: 'people',
            value: '126',
            label: 'Active Members',
            color: '#3B82F6',
        },
        {
            icon: 'ribbon',
            value: '12',
            label: 'Leadership Positions',
            color: '#EF4444',
        },
        {
            icon: 'trophy',
            value: '50+',
            label: 'Awards & Achievements',
            color: '#EAB308',
        },
        {
            icon: 'calendar-number',
            value: '120+',
            label: 'Important Events',
            color: '#14B8A6',
        },
    ];

    const sections = [
        {
            icon: 'book',
            title: 'History & Journey',
            subtitle: 'Our beginning, growth and milestones over the years',
            color: '#7C4DFF',
        },
        {
            icon: 'musical-notes',
            title: 'Instruments',
            subtitle: 'Details about all instruments in our band',
            color: '#22C55E',
        },
        {
            icon: 'shirt',
            title: 'Uniforms',
            subtitle: 'Types of uniforms we wear and their guidelines',
            color: '#3B82F6',
        },
        {
            icon: 'people',
            title: 'Members & Positions',
            subtitle: 'List of members and their respective positions',
            color: '#F97316',
        },
        {
            icon: 'document-text',
            title: 'Rules & Regulations',
            subtitle: 'Guidelines and rules every member must follow',
            color: '#EF4444',
        },
        {
            icon: 'warning',
            title: 'Fines & Penalties',
            subtitle: 'When fines are applied and penalty guidelines',
            color: '#EAB308',
        },
    ];

    return (
        <View style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >

                {/* HEADER */}

                <LinearGradient
                    colors={['#2B145A', '#5B3DF5']}
                    style={styles.header}
                >

                    <View style={styles.topBar}>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={28}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons
                                name="information-circle-outline"
                                size={30}
                                color="#fff"
                            />
                        </TouchableOpacity>

                    </View>

                    <Text style={styles.headerTitle}>
                        About Our Band
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Know about our legacy, journey and values
                    </Text>

                    <MaterialCommunityIcons
                        name="music-clef-treble"
                        size={180}
                        color="rgba(255,255,255,0.05)"
                        style={styles.bgIcon}
                    />

                    <View style={styles.wave} />

                </LinearGradient>

                {/* PROFILE CARD */}

                <View style={styles.profileCard}>

                    <Image
                        source={require('../assets/logo/vajihi-scout-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <View style={{ flex: 1 }}>

                        <Text style={styles.bandName}>
                            Vajihi Scout Mumbra
                        </Text>

                        <Text style={styles.bandSubtitle}>
                            BGMM - Long Live His Holiness
                        </Text>

                        <Text style={styles.bandDescription}>
                            A pioneering band dedicated to musical excellence,
                            discipline and community service.
                        </Text>

                        <View style={styles.verifiedBadge}>
                            <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#fff"
                            />

                            <Text style={styles.verifiedText}>
                                Verified Organisation
                            </Text>
                        </View>

                    </View>

                </View>

                {/* STATS */}

                <View style={styles.statsContainer}>

                    {
                        stats.map((item, index) => (

                            <View
                                key={index}
                                style={styles.statCard}
                            >

                                <View
                                    style={[
                                        styles.statIcon,
                                        {
                                            backgroundColor:
                                                item.color + '20',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon as any}
                                        size={26}
                                        color={item.color}
                                    />
                                </View>

                                <Text style={styles.statValue}>
                                    {item.value}
                                </Text>

                                <Text style={styles.statLabel}>
                                    {item.label}
                                </Text>

                            </View>

                        ))
                    }

                </View>

                {/* SECTIONS */}

                <View style={styles.sectionContainer}>

                    {
                        sections.map((item, index) => (

                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.85}
                                style={styles.sectionCard}
                            >

                                <View
                                    style={[
                                        styles.sectionIcon,
                                        {
                                            backgroundColor:
                                                item.color + '20',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon as any}
                                        size={24}
                                        color={item.color}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>

                                    <Text style={styles.sectionTitle}>
                                        {item.title}
                                    </Text>

                                    <Text style={styles.sectionSubtitle}>
                                        {item.subtitle}
                                    </Text>

                                </View>

                                <Ionicons
                                    name="chevron-forward"
                                    size={24}
                                    color="#999"
                                />

                            </TouchableOpacity>

                        ))
                    }

                </View>

                <View style={{ height: 100 }} />

            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F6F4FF',
    },

    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 120,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
        position: 'relative',
    },

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    iconButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    headerTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        marginTop: 28,
    },

    headerSubtitle: {
        color: '#E9DDFF',
        fontSize: 17,
        marginTop: 10,
        lineHeight: 24,
    },

    bgIcon: {
        position: 'absolute',
        right: -20,
        top: 30,
    },

    wave: {
        position: 'absolute',
        bottom: -40,
        width: '120%',
        height: 90,
        backgroundColor: '#F6F4FF',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
    },

    profileCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -70,
        borderRadius: 32,
        padding: 22,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },

    logo: {
        width: 90,
        height: 90,
        marginRight: 18,
    },

    bandName: {
        fontSize: 30,
        fontWeight: '800',
        color: '#16162E',
    },

    bandSubtitle: {
        color: '#6C4DFF',
        fontSize: 16,
        marginTop: 6,
        fontWeight: '600',
    },

    bandDescription: {
        color: '#666',
        fontSize: 15,
        marginTop: 10,
        lineHeight: 22,
    },

    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C4DFF',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 14,
    },

    verifiedText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: '700',
        fontSize: 13,
    },

    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 24,
    },

    statCard: {
        width: '31%',

        backgroundColor: '#fff',
        borderRadius: 22,

        paddingVertical: 20,
        paddingHorizontal: 10,

        marginBottom: 14,
        alignItems: 'center',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },

    statIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },

    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#16162E',
        marginTop: 12,
    },

    statLabel: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
        marginTop: 6,
        lineHeight: 16,
    },

    sectionContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
    },

    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },

    sectionIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    sectionTitle: {
        fontSize: 21,
        fontWeight: '700',
        color: '#16162E',
    },

    sectionSubtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 6,
        lineHeight: 20,
    },

});