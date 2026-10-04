import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {

    ActivityIndicator,

    Alert,

    Image,

    Modal,

    RefreshControl,

    SafeAreaView,

    ScrollView,

    StyleSheet,

    Switch,

    Text,

    TextInput,

    TouchableOpacity,

    View,

} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {

    Ionicons,

} from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRouter } from 'expo-router';



type AboutSettings = {

    settings_id?: string;

    band_name: string;

    band_subtitle: string;

    band_description: string;

    established_year: string;

    years_completed: string;

    instruments_count: string;

    marches_count: string;

    uniforms_count: string;

    active_members: string;

    leadership_positions: string;

    awards_achievements: string;

    important_events: string;

    // Social Media
    instagram_id: string;
    instagram_link: string;
    whatsapp_number: string;
    whatsapp_link: string;
    youtube_id: string;
    youtube_link: string;

};



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

    created_by?: string;

    created_at?: string;

    updated_at?: string;

};



type CurrentUser = {

    user_id: string;

    name: string;

    role: string;

    permissions?: Record<string, boolean>;

};



type SectionConfig = {

    type: string;

    title: string;

    subtitle: string;

    icon: string;

    color: string;

};


type DetailField = {
    key: string;
    label: string;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'number-pad';
};

const SECTION_DETAIL_FIELDS: Record<string, DetailField[]> = {
    rules: [
        { key: 'category', label: 'Category', placeholder: 'Example: Uniform' },
        { key: 'applies_to', label: 'Applies To', placeholder: 'Example: All Members' },
    ],
    penalties: [
        { key: 'penalty_amount', label: 'Penalty Amount', placeholder: 'Example: ₹150' },
        { key: 'category', label: 'Category', placeholder: 'Example: Grooming' },
        { key: 'applies_to', label: 'Applies To', placeholder: 'Example: All Members' },
    ],
    positions: [
        { key: 'position', label: 'Position', placeholder: 'Example: Band Master' },
        { key: 'responsibilities', label: 'Responsibilities', placeholder: 'Example: Leadership & Training', multiline: true },
        { key: 'status', label: 'Status', placeholder: 'Example: Active' },
    ],
    instruments: [
        { key: 'instrument_type', label: 'Instrument Type', placeholder: 'Example: Brass' },
        { key: 'total_quantity', label: 'Total Quantity', placeholder: 'Example: 8', keyboardType: 'number-pad' },
        { key: 'available', label: 'Available', placeholder: 'Example: 5', keyboardType: 'number-pad' },
        { key: 'assigned', label: 'Assigned', placeholder: 'Example: 3', keyboardType: 'number-pad' },
        { key: 'condition', label: 'Condition', placeholder: 'Example: Good' },
    ],
    uniforms: [
        { key: 'uniform_type', label: 'Uniform Type', placeholder: 'Example: Formal' },
        { key: 'blazer', label: 'Blazer', placeholder: 'Example: Required' },
        { key: 't_shirt', label: 'T-Shirt', placeholder: 'Example: Required' },
        { key: 'trouser', label: 'Trouser', placeholder: 'Example: Required' },
        { key: 'cap', label: 'Cap', placeholder: 'Example: Required' },
        { key: 'shoes', label: 'Shoes', placeholder: 'Example: Black Formal Shoes' },
    ],
    history: [
        { key: 'year', label: 'Year / Period', placeholder: 'Example: 2002' },
        { key: 'milestone_type', label: 'Milestone Type', placeholder: 'Example: The Beginning' },
    ],
};

const SECTION_FORM_HINTS: Record<string, { titleLabel: string; titlePlaceholder: string; subtitlePlaceholder: string; contentPlaceholder: string }> = {
    rules: {
        titleLabel: 'Rule Title',
        titlePlaceholder: 'Example: Uniform Discipline',
        subtitlePlaceholder: 'Example: Proper uniform must be maintained',
        contentPlaceholder: 'Example: Every member must report for band duty in complete and properly maintained uniform.',
    },
    penalties: {
        titleLabel: 'Penalty Name',
        titlePlaceholder: 'Example: Hair',
        subtitlePlaceholder: 'Example: Decent Hair Cut',
        contentPlaceholder: 'Example: Members must maintain a decent haircut before attending any band duty.',
    },
    positions: {
        titleLabel: 'Position Name',
        titlePlaceholder: 'Example: Band Master',
        subtitlePlaceholder: 'Example: Band Leadership',
        contentPlaceholder: 'Example: Responsible for leading the band, conducting practices and maintaining discipline.',
    },
    instruments: {
        titleLabel: 'Instrument Name',
        titlePlaceholder: 'Example: Trumpet',
        subtitlePlaceholder: 'Example: Brass Instrument',
        contentPlaceholder: 'Example: One of the main brass instruments used during marches, ceremonies and performances.',
    },
    uniforms: {
        titleLabel: 'Uniform Name',
        titlePlaceholder: 'Example: Blue Blazer Uniform',
        subtitlePlaceholder: 'Example: Formal Band Uniform',
        contentPlaceholder: 'Example: Worn during formal band duties, ceremonies and special occasions.',
    },
    history: {
        titleLabel: 'Milestone Title',
        titlePlaceholder: 'Example: The Beginning',
        subtitlePlaceholder: 'Example: Where our journey started',
        contentPlaceholder: 'Example: Vajihi Scout Mumbra began its journey in 2002 with the vision of building a disciplined musical group.',
    },
};




const SECTIONS: SectionConfig[] = [

    {

        type: 'rules',

        title: 'Rules & Regulations',

        subtitle: 'Guidelines and rules every member must follow',

        icon: 'document-text-outline',

        color: '#EF4444',

    },

    {

        type: 'penalties',

        title: 'Fines & Penalties',

        subtitle: 'When fines are applied and penalty guidelines',

        icon: 'warning-outline',

        color: '#EAB308',

    },

    {

        type: 'positions',

        title: 'Members & Positions',

        subtitle: 'List of members and their respective positions',

        icon: 'people-outline',

        color: '#F97316',

    },

    {

        type: 'instruments',

        title: 'Instruments',

        subtitle: 'Details about all instruments in our band',

        icon: 'musical-notes-outline',

        color: '#22C55E',

    },

    {

        type: 'uniforms',

        title: 'Uniforms',

        subtitle: 'Types of uniforms we wear and their guidelines',

        icon: 'shirt-outline',

        color: '#3B82F6',

    },

    {

        type: 'history',

        title: 'History & Journey',

        subtitle: 'Our beginning, growth and milestones over the years',

        icon: 'book-outline',

        color: '#7C4DFF',

    },

];



const DEFAULT_SETTINGS: AboutSettings = {

    band_name: 'Vajihi Scout Mumbra',

    band_subtitle: 'BGMM - Long Live His Holiness',

    band_description:

        'A pioneering band dedicated to musical excellence, discipline and community service.',

    established_year: '2002',

    years_completed: '20+',

    instruments_count: '15',

    marches_count: '35',

    uniforms_count: '8',

    active_members: '62',

    leadership_positions: '8',

    awards_achievements: '50+',

    important_events: '120+',

    // Social Media
    instagram_id: '',
    instagram_link: '',
    whatsapp_number: '',
    whatsapp_link: '',
    youtube_id: '',
    youtube_link: '',

};



const ENV_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const API_BASE_URL = ENV_BASE_URL.endsWith('/api')

    ? ENV_BASE_URL

    : `${ENV_BASE_URL.replace(/\/$/, '')}/api`;



function getSectionConfig(type: string): SectionConfig {

    return (

        SECTIONS.find((section) => section.type === type) || {

            type,

            title: type,

            subtitle: '',

            icon: 'information-circle-outline',

            color: '#6C4DFF',

        }

    );

}



function formatDetailValue(value: any): string {

    if (value === null || value === undefined) return '';

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {

        return String(value);

    }

    if (Array.isArray(value)) {

        return value.map((item) => formatDetailValue(item)).join(', ');

    }

    return JSON.stringify(value, null, 2);

}



export default function AboutBandScreen() {

    const router = useRouter();



    const [settings, setSettings] = useState<AboutSettings>(DEFAULT_SETTINGS);

    const [content, setContent] = useState<AboutContent[]>([]);

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);



    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState('');

    const [expandedSection, setExpandedSection] = useState<string | null>(null);



    const [contentModalVisible, setContentModalVisible] = useState(false);

    const [settingsModalVisible, setSettingsModalVisible] = useState(false);



    const [editingContent, setEditingContent] = useState<AboutContent | null>(null);

    const [contentForm, setContentForm] = useState({

        section_type: 'rules',

        title: '',

        subtitle: '',

        content: '',

        image: '',

        display_order: '0',

        active: true,

    });

    const [detailForm, setDetailForm] = useState<Record<string, string>>({});



    const [settingsForm, setSettingsForm] = useState<AboutSettings>(DEFAULT_SETTINGS);

    const [saving, setSaving] = useState(false);



    const isAdmin = currentUser?.role === 'admin';



    const stats = useMemo(

        () => [

            {

                icon: 'calendar-outline',

                value: settings.established_year,

                label: 'Established Year',

                color: '#7C4DFF',

            },

            {

                icon: 'shield-checkmark-outline',

                value: settings.years_completed,

                label: 'Years Completed',

                color: '#22C55E',

            },

            {

                icon: 'musical-notes-outline',

                value: settings.instruments_count,

                label: 'Types of Instruments',

                color: '#F59E0B',

            },

            {

                icon: 'drum-outline',

                value: settings.marches_count,

                label: 'Marches We Play',

                color: '#8B5CF6',

            },

            {

                icon: 'shirt-outline',

                value: settings.uniforms_count,

                label: 'Types of Uniforms',

                color: '#06B6D4',

            },

            {

                icon: 'people-outline',

                value: settings.active_members,

                label: 'Active Members',

                color: '#3B82F6',

            },

            {

                icon: 'ribbon-outline',

                value: settings.leadership_positions,

                label: 'Leadership Positions',

                color: '#EF4444',

            },

            {

                icon: 'trophy-outline',

                value: settings.awards_achievements,

                label: 'Awards & Achievements',

                color: '#EAB308',

            },

            {

                icon: 'calendar-number-outline',

                value: settings.important_events,

                label: 'Important Events',

                color: '#14B8A6',

            },

        ],

        [settings],

    );



    const getToken = async () => {

        const keys = ['session_token', 'sessionToken', 'auth_token', 'token'];

        for (const key of keys) {

            const value = await AsyncStorage.getItem(key);

            if (value) return value;

        }

        return null;

    };



    const apiRequest = async (

        endpoint: string,

        options: RequestInit = {},

    ): Promise<any> => {

        const token = await getToken();



        const headers: Record<string, string> = {

            Accept: 'application/json',

            'Content-Type': 'application/json',

            ...(options.headers as Record<string, string> | undefined),

        };



        if (token) {

            headers.Authorization = `Bearer ${token}`;

        }



        const response = await fetch(`${API_BASE_URL}${endpoint}`, {

            ...options,

            headers,

            credentials: 'include',

        });



        let data: any = null;

        try {

            data = await response.json();

        } catch {

            data = null;

        }



        if (!response.ok) {

            const message =

                data?.detail ||

                data?.message ||

                `Request failed with status ${response.status}`;

            throw new Error(message);

        }



        return data;

    };



    const loadAbout = useCallback(async () => {

        try {

            setError('');



            const [settingsData, contentData, userData] = await Promise.all([

                apiRequest('/about/settings'),

                apiRequest('/about/content'),

                apiRequest('/auth/me'),

            ]);



            setSettings({

                ...DEFAULT_SETTINGS,

                ...(settingsData || {}),

            });



            setSettingsForm({

                ...DEFAULT_SETTINGS,

                ...(settingsData || {}),

            });



            setContent(Array.isArray(contentData) ? contentData : []);

            setCurrentUser(userData || null);

        } catch (err: any) {

            console.error('Failed to load About page:', err);

            setError(err?.message || 'Unable to load About information.');

        } finally {

            setLoading(false);

            setRefreshing(false);

        }

    }, []);



    useEffect(() => {

        loadAbout();

    }, [loadAbout]);



    const onRefresh = async () => {

        setRefreshing(true);

        await loadAbout();

    };



    const sectionContent = (sectionType: string) =>

        content

            .filter((item) => item.section_type === sectionType)

            .sort((a, b) => {

                if (a.display_order !== b.display_order) {

                    return a.display_order - b.display_order;

                }

                return (a.created_at || '').localeCompare(b.created_at || '');

            });



    const openCreateContent = (sectionType: string) => {

        setEditingContent(null);

        setContentForm({

            section_type: sectionType,

            title: '',

            subtitle: '',

            content: '',

            image: '',

            display_order: String(sectionContent(sectionType).length),

            active: true,

        });

        setDetailForm({});

        setContentModalVisible(true);

    };



    const openEditContent = (item: AboutContent) => {

        setEditingContent(item);

        setContentForm({

            section_type: item.section_type,

            title: item.title || '',

            subtitle: item.subtitle || '',

            content: item.content || '',

            image: item.image || '',

            display_order: String(item.display_order ?? 0),

            active: item.active,

        });

        const existingDetails: Record<string, any> = item.details || {};

        const detailValues: Record<string, string> = {};

        (SECTION_DETAIL_FIELDS[item.section_type] || []).forEach((field) => {

            const value = existingDetails[field.key];

            detailValues[field.key] = value === undefined || value === null ? '' : String(value);

        });

        setDetailForm(detailValues);

        setContentModalVisible(true);

    };



    const saveContent = async () => {

        if (!isAdmin) return;



        if (!contentForm.title.trim()) {

            Alert.alert('Required', 'Please enter a title.');

            return;

        }



        const parsedDetails: Record<string, string> = {};

        Object.entries(detailForm).forEach(([key, value]) => {

            const trimmed = String(value || '').trim();

            if (trimmed) parsedDetails[key] = trimmed;

        });



        setSaving(true);



        try {

            const body = {

                section_type: contentForm.section_type,

                title: contentForm.title.trim(),

                subtitle: contentForm.subtitle.trim() || null,

                content: contentForm.content.trim() || null,

                details: Object.keys(parsedDetails).length > 0 ? parsedDetails : null,

                image: contentForm.image.trim() || null,

                display_order: Number.parseInt(contentForm.display_order, 10) || 0,

                ...(editingContent ? { active: contentForm.active } : {}),

            };



            if (editingContent) {

                await apiRequest(`/about/content/${editingContent.content_id}`, {

                    method: 'PUT',

                    body: JSON.stringify(body),

                });

            } else {

                await apiRequest('/about/content', {

                    method: 'POST',

                    body: JSON.stringify(body),

                });

            }



            setContentModalVisible(false);

            await loadAbout();

        } catch (err: any) {

            Alert.alert('Unable to save', err?.message || 'Something went wrong.');

        } finally {

            setSaving(false);

        }

    };



    const deleteContent = (item: AboutContent) => {

        if (!isAdmin) return;



        Alert.alert(

            'Delete Content',

            `Delete "${item.title}" permanently?`,

            [

                { text: 'Cancel', style: 'cancel' },

                {

                    text: 'Delete',

                    style: 'destructive',

                    onPress: async () => {

                        try {

                            setSaving(true);

                            await apiRequest(`/about/content/${item.content_id}`, {

                                method: 'DELETE',

                            });

                            await loadAbout();

                        } catch (err: any) {

                            Alert.alert(

                                'Unable to delete',

                                err?.message || 'Something went wrong.',

                            );

                        } finally {

                            setSaving(false);

                        }

                    },

                },

            ],

        );

    };



    const saveSettings = async () => {

        if (!isAdmin) return;



        const requiredFields: Array<keyof AboutSettings> = [

            'band_name',

            'band_subtitle',

            'band_description',

            'established_year',

            'years_completed',

            'instruments_count',

            'marches_count',

            'uniforms_count',

            'active_members',

            'leadership_positions',

            'awards_achievements',

            'important_events',

        ];



        for (const field of requiredFields) {

            if (!String(settingsForm[field] || '').trim()) {

                Alert.alert('Required', `${field.replace(/\_/g, ' ')} cannot be empty.`);

                return;

            }

        }



        setSaving(true);



        try {

            const payload = {

                band_name: settingsForm.band_name.trim(),

                band_subtitle: settingsForm.band_subtitle.trim(),

                band_description: settingsForm.band_description.trim(),

                established_year: settingsForm.established_year.trim(),

                years_completed: settingsForm.years_completed.trim(),

                instruments_count: settingsForm.instruments_count.trim(),

                marches_count: settingsForm.marches_count.trim(),

                uniforms_count: settingsForm.uniforms_count.trim(),

                active_members: settingsForm.active_members.trim(),

                leadership_positions: settingsForm.leadership_positions.trim(),

                awards_achievements: settingsForm.awards_achievements.trim(),

                important_events: settingsForm.important_events.trim(),

                // Social Media
                instagram_id: settingsForm.instagram_id.trim(),
                instagram_link: settingsForm.instagram_link.trim(),
                whatsapp_number: settingsForm.whatsapp_number.trim(),
                whatsapp_link: settingsForm.whatsapp_link.trim(),
                youtube_id: settingsForm.youtube_id.trim(),
                youtube_link: settingsForm.youtube_link.trim(),

            };



            const updated = await apiRequest('/about/settings', {

                method: 'PUT',

                body: JSON.stringify(payload),

            });



            setSettings({

                ...DEFAULT_SETTINGS,

                ...(updated || payload),

            });



            setSettingsForm({

                ...DEFAULT_SETTINGS,

                ...(updated || payload),

            });



            setSettingsModalVisible(false);

            Alert.alert('Saved', 'About page information has been updated.');

        } catch (err: any) {

            Alert.alert(

                'Unable to save',

                err?.message || 'Something went wrong while saving.',

            );

        } finally {

            setSaving(false);

        }

    };



    const renderContentItem = (item: AboutContent, color: string) => (

        <View key={item.content_id} style={styles.contentItem}>

            {item.image ? (

                <Image

                    source={{ uri: item.image }}

                    style={styles.contentImage}

                    resizeMode="cover"

                />

            ) : null}



            <View style={styles.contentItemHeader}>

                <View style={[styles.contentBullet, { backgroundColor: color }]} />

                <View style={styles.contentItemTitleContainer}>

                    <Text style={styles.contentItemTitle}>{item.title}</Text>

                    {item.subtitle ? (

                        <Text style={styles.contentItemSubtitle}>{item.subtitle}</Text>

                    ) : null}

                </View>

            </View>



            {item.content ? (

                <Text style={styles.contentText}>{item.content}</Text>

            ) : null}



            {item.details && Object.keys(item.details).length > 0 ? (

                <View style={styles.detailsBox}>

                    {Object.entries(item.details).map(([key, value]) => (

                        <View key={key} style={styles.detailRow}>

                            <Text style={styles.detailKey}>

                                {key.replace(/\_/g, ' ')}

                            </Text>

                            <Text style={styles.detailValue}>{formatDetailValue(value)}</Text>

                        </View>

                    ))}

                </View>

            ) : null}



            {isAdmin ? (

                <View style={styles.adminItemActions}>

                    <TouchableOpacity

                        style={styles.editSmallButton}

                        onPress={() => openEditContent(item)}

                        activeOpacity={0.8}

                    >

                        <Ionicons name="create-outline" size={17} color="#5B3DF5" />

                        <Text style={styles.editSmallText}>Edit</Text>

                    </TouchableOpacity>



                    <TouchableOpacity

                        style={styles.deleteSmallButton}

                        onPress={() => deleteContent(item)}

                        activeOpacity={0.8}

                    >

                        <Ionicons name="trash-outline" size={17} color="#EF4444" />

                        <Text style={styles.deleteSmallText}>Delete</Text>

                    </TouchableOpacity>

                </View>

            ) : null}

        </View>

    );



    const renderSection = (section: SectionConfig) => {

        const items = sectionContent(section.type);

        const expanded = expandedSection === section.type;



        return (

            <View key={section.type} style={styles.sectionWrapper}>

                <TouchableOpacity

                    activeOpacity={0.88}

                    style={styles.sectionCard}

                    onPress={() =>

                        setExpandedSection(expanded ? null : section.type)

                    }

                >

                    <View

                        style={[

                            styles.sectionIcon,

                            { backgroundColor: `${section.color}20` },

                        ]}

                    >

                        <Ionicons

                            name={section.icon as any}

                            size={25}

                            color={section.color}

                        />

                    </View>



                    <View style={styles.sectionTextContainer}>

                        <Text style={styles.sectionTitle} numberOfLines={2}>

                            {section.title}

                        </Text>

                        <Text style={styles.sectionSubtitle} numberOfLines={2}>

                            {section.subtitle}

                        </Text>

                        <View style={styles.sectionCountRow}>

                            <View

                                style={[

                                    styles.countDot,

                                    { backgroundColor: section.color },

                                ]}

                            />

                            <Text style={styles.sectionCount}>

                                {items.length}{' '}

                                {items.length === 1 ? 'entry' : 'entries'}

                            </Text>

                        </View>

                    </View>



                    <Ionicons

                        name={expanded ? 'chevron-up' : 'chevron-down'}

                        size={23}

                        color="#999"

                    />

                </TouchableOpacity>



                {expanded ? (

                    <View style={styles.expandedContent}>

                        {items.length > 0 ? (

                            items.map((item) => renderContentItem(item, section.color))

                        ) : (

                            <View style={styles.emptyContent}>

                                <Ionicons

                                    name="document-text-outline"

                                    size={34}

                                    color="#B7B1C9"

                                />

                                <Text style={styles.emptyTitle}>No content yet</Text>

                                <Text style={styles.emptySubtitle}>

                                    {isAdmin

                                        ? 'Add the first entry for this section.'

                                        : 'Content for this section has not been added yet.'}

                                </Text>

                            </View>

                        )}



                        {isAdmin ? (

                            <TouchableOpacity

                                style={[

                                    styles.addContentButton,

                                    { borderColor: section.color },

                                ]}

                                onPress={() => openCreateContent(section.type)}

                                activeOpacity={0.85}

                            >

                                <Ionicons

                                    name="add-circle-outline"

                                    size={20}

                                    color={section.color}

                                />

                                <Text

                                    style={[styles.addContentText, { color: section.color }]}

                                >

                                    Add {section.title}

                                </Text>

                            </TouchableOpacity>

                        ) : null}

                    </View>

                ) : null}

            </View>

        );

    };



    const renderSettingsField = (

        key: keyof AboutSettings,

        label: string,

        multiline = false,

    ) => (

        <View style={styles.formField} key={key}>

            <Text style={styles.formLabel}>{label}</Text>

            <TextInput

                value={String(settingsForm[key] ?? '')}

                onChangeText={(value) =>

                    setSettingsForm((prev) => ({ ...prev, [key]: value }))

                }

                style={[styles.input, multiline && styles.multilineInput]}

                multiline={multiline}

                textAlignVertical={multiline ? 'top' : 'center'}

                placeholder={label}

                placeholderTextColor="#AAA"

            />

        </View>

    );



    if (loading) {

        return (

            <SafeAreaView style={styles.container}>

                <LinearGradient

                    colors={['#2B145A', '#5B3DF5']}

                    style={styles.loadingHeader}

                >

                    <ActivityIndicator size="large" color="#fff" />

                    <Text style={styles.loadingText}>Loading About...</Text>

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

                        tintColor="#6C4DFF"

                    />

                }

            >

                <LinearGradient

                    colors={['#2B145A', '#5B3DF5']}

                    style={styles.header}

                >

                    <View style={styles.topBar}>

                        <TouchableOpacity

                            style={styles.iconButton}

                            onPress={() => router.back()}

                            activeOpacity={0.8}

                        >

                            <Ionicons name="arrow-back" size={27} color="#fff" />

                        </TouchableOpacity>



                        {isAdmin ? (

                            <TouchableOpacity

                                style={styles.iconButton}

                                onPress={() => {

                                    setSettingsForm({ ...settings });

                                    setSettingsModalVisible(true);

                                }}

                                activeOpacity={0.8}

                            >

                                <Ionicons name="settings-outline" size={27} color="#fff" />

                            </TouchableOpacity>

                        ) : (

                            <View style={styles.iconButton}>

                                <Ionicons

                                    name="information-circle-outline"

                                    size={29}

                                    color="#fff"

                                />

                            </View>

                        )}

                    </View>



                    <Text style={styles.headerTitle}>About Our Band</Text>

                    <Text style={styles.headerSubtitle}>

                        Know about our legacy, journey and values

                    </Text>

                </LinearGradient>



                {error ? (

                    <View style={styles.errorCard}>

                        <Ionicons name="cloud-offline-outline" size={25} color="#EF4444" />

                        <View style={styles.errorTextContainer}>

                            <Text style={styles.errorTitle}>Unable to load About</Text>

                            <Text style={styles.errorMessage}>{error}</Text>

                        </View>

                        <TouchableOpacity

                            style={styles.retryButton}

                            onPress={loadAbout}

                        >

                            <Text style={styles.retryText}>Retry</Text>

                        </TouchableOpacity>

                    </View>

                ) : null}



                <View style={styles.profileCard}>

                    <Image

                        source={require('../assets/logo/vajihi-scout-logo.png')}

                        style={styles.logo}

                        resizeMode="contain"

                    />



                    <View style={styles.profileTextContainer}>

                        <Text style={styles.bandName} numberOfLines={2}>

                            {settings.band_name}

                        </Text>



                        <Text style={styles.bandSubtitle}>

                            {settings.band_subtitle}

                        </Text>



                        <Text style={styles.bandDescription}>

                            {settings.band_description}

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



                <View style={styles.statsContainer}>

                    {stats.map((item, index) => (

                        <View style={styles.statCard} key={`${item.label}-${index}`}>

                            <View

                                style={[

                                    styles.statIcon,

                                    { backgroundColor: `${item.color}20` },

                                ]}

                            >

                                <Ionicons

                                    name={item.icon as any}

                                    size={25}

                                    color={item.color}

                                />

                            </View>



                            <Text style={styles.statValue}>{item.value}</Text>

                            <Text style={styles.statLabel} numberOfLines={2}>

                                {item.label}

                            </Text>

                        </View>

                    ))}

                </View>



                <View style={styles.sectionHeadingRow}>

                    <View>

                        <Text style={styles.sectionHeading}>Explore Our Band</Text>

                        <Text style={styles.sectionHeadingSubtitle}>

                            Tap a section to view its information

                        </Text>

                    </View>



                    {isAdmin ? (

                        <View style={styles.adminBadge}>

                            <Ionicons name="shield-checkmark" size={15} color="#5B3DF5" />

                            <Text style={styles.adminBadgeText}>ADMIN</Text>

                        </View>

                    ) : null}

                </View>



                <View style={styles.sectionContainer}>

                    {SECTIONS.map(renderSection)}

                </View>



                <View style={styles.footerSpace} />

            </ScrollView>



            {/* CONTENT CREATE / EDIT MODAL */}

            <Modal

                visible={contentModalVisible}

                animationType="slide"

                transparent

                onRequestClose={() => setContentModalVisible(false)}

            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalCard}>

                        <View style={styles.modalHeader}>

                            <View>

                                <Text style={styles.modalTitle}>

                                    {editingContent ? 'Edit Content' : 'Add Content'}

                                </Text>

                                <Text style={styles.modalSubtitle}>

                                    {getSectionConfig(contentForm.section_type).title}

                                </Text>

                            </View>



                            <TouchableOpacity

                                style={styles.closeButton}

                                onPress={() => setContentModalVisible(false)}

                            >

                                <Ionicons name="close" size={24} color="#555" />

                            </TouchableOpacity>

                        </View>



                        <ScrollView

                            showsVerticalScrollIndicator={false}

                            keyboardShouldPersistTaps="handled"

                        >

                            <View style={styles.selectedSectionCard}>

                                <View

                                    style={[

                                        styles.selectedSectionIcon,

                                        {

                                            backgroundColor: `${getSectionConfig(contentForm.section_type).color}18`,

                                        },

                                    ]}

                                >

                                    <Ionicons

                                        name={getSectionConfig(contentForm.section_type).icon as any}

                                        size={24}

                                        color={getSectionConfig(contentForm.section_type).color}

                                    />

                                </View>

                                <View style={styles.selectedSectionText}>

                                    <Text style={styles.selectedSectionLabel}>Section</Text>

                                    <Text style={styles.selectedSectionTitle}>

                                        {getSectionConfig(contentForm.section_type).title}

                                    </Text>

                                    <Text style={styles.selectedSectionHint}>

                                        This form is customized for this section.

                                    </Text>

                                </View>

                            </View>



                            <View style={styles.formField}>

                                <Text style={styles.formLabel}>

                                    {SECTION_FORM_HINTS[contentForm.section_type]?.titleLabel || 'Title'} *

                                </Text>

                                <TextInput

                                    value={contentForm.title}

                                    onChangeText={(value) =>

                                        setContentForm((prev) => ({

                                            ...prev,

                                            title: value,

                                        }))

                                    }

                                    style={styles.input}

                                    placeholder={SECTION_FORM_HINTS[contentForm.section_type]?.titlePlaceholder || 'Enter title'}

                                    placeholderTextColor="#AAA"

                                />

                            </View>



                            <View style={styles.formField}>

                                <Text style={styles.formLabel}>Subtitle</Text>

                                <TextInput

                                    value={contentForm.subtitle}

                                    onChangeText={(value) =>

                                        setContentForm((prev) => ({

                                            ...prev,

                                            subtitle: value,

                                        }))

                                    }

                                    style={styles.input}

                                    placeholder={SECTION_FORM_HINTS[contentForm.section_type]?.subtitlePlaceholder || 'Optional subtitle'}

                                    placeholderTextColor="#AAA"

                                />

                            </View>



                            <View style={styles.formField}>

                                <Text style={styles.formLabel}>Content</Text>

                                <TextInput

                                    value={contentForm.content}

                                    onChangeText={(value) =>

                                        setContentForm((prev) => ({

                                            ...prev,

                                            content: value,

                                        }))

                                    }

                                    style={[styles.input, styles.multilineInputLarge]}

                                    placeholder={SECTION_FORM_HINTS[contentForm.section_type]?.contentPlaceholder || 'Write the section content...'}

                                    placeholderTextColor="#AAA"

                                    multiline

                                    textAlignVertical="top"

                                />

                            </View>



                            <View style={styles.formField}>

                                <Text style={styles.formLabel}>Image URL</Text>

                                <TextInput

                                    value={contentForm.image}

                                    onChangeText={(value) =>

                                        setContentForm((prev) => ({

                                            ...prev,

                                            image: value,

                                        }))

                                    }

                                    style={styles.input}

                                    placeholder="Optional — paste an image URL"

                                    placeholderTextColor="#AAA"

                                    autoCapitalize="none"

                                />

                                <Text style={styles.fieldHelperText}>

                                    Add a historical/photo image when it helps explain this entry.

                                </Text>

                            </View>



                            <View style={styles.formSectionCard}>

                                <View style={styles.formSectionHeader}>

                                    <View>

                                        <Text style={styles.formSectionTitle}>

                                            {getSectionConfig(contentForm.section_type).title} Details

                                        </Text>

                                        <Text style={styles.formSectionHint}>

                                            These fields are optional. Fill only what applies.

                                        </Text>

                                    </View>

                                    <Ionicons

                                        name="options-outline"

                                        size={20}

                                        color={getSectionConfig(contentForm.section_type).color}

                                    />

                                </View>



                                {(SECTION_DETAIL_FIELDS[contentForm.section_type] || []).map((field) => (

                                    <View style={styles.formField} key={field.key}>

                                        <Text style={styles.formLabel}>{field.label}</Text>

                                        <TextInput

                                            value={detailForm[field.key] || ''}

                                            onChangeText={(value) =>

                                                setDetailForm((prev) => ({

                                                    ...prev,

                                                    [field.key]: value,

                                                }))

                                            }

                                            style={[

                                                styles.input,

                                                field.multiline && styles.multilineInput,

                                            ]}

                                            placeholder={field.placeholder}

                                            placeholderTextColor="#AAA"

                                            multiline={field.multiline}

                                            textAlignVertical={field.multiline ? 'top' : 'center'}

                                            keyboardType={field.keyboardType || 'default'}

                                        />

                                    </View>

                                ))}

                            </View>



                            <View style={styles.formField}>

                                <Text style={styles.formLabel}>Display Order</Text>

                                <TextInput

                                    value={contentForm.display_order}

                                    onChangeText={(value) =>

                                        setContentForm((prev) => ({

                                            ...prev,

                                            display_order: value.replace(/[^0-9]/g, ''),

                                        }))

                                    }

                                    style={styles.input}

                                    placeholder="0"

                                    placeholderTextColor="#AAA"

                                    keyboardType="number-pad"

                                />

                                <Text style={styles.fieldHelperText}>

                                    Lower numbers appear first.

                                </Text>

                            </View>



                            {editingContent ? (

                                <View style={styles.switchRow}>

                                    <View style={{ flex: 1 }}>

                                        <Text style={styles.formLabel}>Active</Text>

                                        <Text style={styles.switchDescription}>

                                            Inactive content is hidden from normal users.

                                        </Text>

                                    </View>



                                    <Switch

                                        value={contentForm.active}

                                        onValueChange={(value) =>

                                            setContentForm((prev) => ({

                                                ...prev,

                                                active: value,

                                            }))

                                        }

                                        trackColor={{ false: '#DDD', true: '#B8ACFF' }}

                                        thumbColor={

                                            contentForm.active ? '#5B3DF5' : '#888'

                                        }

                                    />

                                </View>

                            ) : null}



                            <TouchableOpacity

                                style={styles.saveButton}

                                onPress={saveContent}

                                disabled={saving}

                                activeOpacity={0.85}

                            >

                                {saving ? (

                                    <ActivityIndicator color="#fff" />

                                ) : (

                                    <>

                                        <Ionicons name="save-outline" size={20} color="#fff" />

                                        <Text style={styles.saveButtonText}>

                                            {editingContent ? 'Update Content' : 'Add Content'}

                                        </Text>

                                    </>

                                )}

                            </TouchableOpacity>



                            <View style={{ height: 30 }} />

                        </ScrollView>

                    </View>

                </View>

            </Modal>



            {/* SETTINGS MODAL */}

            <Modal

                visible={settingsModalVisible}

                animationType="slide"

                transparent

                onRequestClose={() => setSettingsModalVisible(false)}

            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalCard}>

                        <View style={styles.modalHeader}>

                            <View>

                                <Text style={styles.modalTitle}>About Settings</Text>

                                <Text style={styles.modalSubtitle}>

                                    Update the main About page information

                                </Text>

                            </View>



                            <TouchableOpacity

                                style={styles.closeButton}

                                onPress={() => setSettingsModalVisible(false)}

                            >

                                <Ionicons name="close" size={24} color="#555" />

                            </TouchableOpacity>

                        </View>



                        <ScrollView

                            showsVerticalScrollIndicator={false}

                            keyboardShouldPersistTaps="handled"

                        >

                            {renderSettingsField('band_name', 'Band Name')}

                            {renderSettingsField('band_subtitle', 'Band Subtitle')}

                            {renderSettingsField(

                                'band_description',

                                'Band Description',

                                true,

                            )}



                            <Text style={styles.formSectionTitle}>Statistics</Text>



                            {renderSettingsField(

                                'established_year',

                                'Established Year',

                            )}

                            {renderSettingsField(

                                'years_completed',

                                'Years Completed',

                            )}

                            {renderSettingsField(

                                'instruments_count',

                                'Types of Instruments',

                            )}

                            {renderSettingsField(

                                'marches_count',

                                'Marches We Play',

                            )}

                            {renderSettingsField(

                                'uniforms_count',

                                'Types of Uniforms',

                            )}

                            {renderSettingsField(

                                'active_members',

                                'Active Members',

                            )}

                            {renderSettingsField(

                                'leadership_positions',

                                'Leadership Positions',

                            )}

                            {renderSettingsField(

                                'awards_achievements',

                                'Awards & Achievements',

                            )}

                            {renderSettingsField(

                                'important_events',

                                'Important Events',

                            )}

                            <View style={styles.formSectionCard}>

                                <View style={styles.formSectionHeader}>

                                    <View style={{ flex: 1 }}>

                                        <Text style={styles.formSectionTitle}>
                                            Social Media
                                        </Text>

                                        <Text style={styles.formSectionHint}>
                                            Add the official social media accounts for the band.
                                        </Text>

                                    </View>

                                    <Ionicons
                                        name="share-social-outline"
                                        size={22}
                                        color="#5B3DF5"
                                    />

                                </View>

                                {renderSettingsField(
                                    'instagram_id',
                                    'Instagram ID',
                                )}

                                {renderSettingsField(
                                    'instagram_link',
                                    'Instagram Link',
                                )}

                                {renderSettingsField(
                                    'whatsapp_number',
                                    'WhatsApp Number',
                                )}

                                {renderSettingsField(
                                    'whatsapp_link',
                                    'WhatsApp Link',
                                )}

                                {renderSettingsField(
                                    'youtube_id',
                                    'YouTube ID / Channel Name',
                                )}

                                {renderSettingsField(
                                    'youtube_link',
                                    'YouTube Link',
                                )}

                            </View>

                            <TouchableOpacity

                                style={styles.saveButton}

                                onPress={saveSettings}

                                disabled={saving}

                                activeOpacity={0.85}

                            >

                                {saving ? (

                                    <ActivityIndicator color="#fff" />

                                ) : (

                                    <>

                                        <Ionicons name="save-outline" size={20} color="#fff" />

                                        <Text style={styles.saveButtonText}>

                                            Save About Settings

                                        </Text>

                                    </>

                                )}

                            </TouchableOpacity>



                            <View style={{ height: 30 }} />

                        </ScrollView>

                    </View>

                </View>

            </Modal>

        </SafeAreaView>

    );

}



const styles = StyleSheet.create({

    container: {

        flex: 1,

        backgroundColor: '#F6F4FF',

    },



    loadingHeader: {

        flex: 1,

        justifyContent: 'center',

        alignItems: 'center',

    },



    loadingText: {

        color: '#fff',

        fontSize: 16,

        fontWeight: '600',

        marginTop: 12,

    },



    header: {

        paddingTop: 70,

        paddingHorizontal: 24,

        paddingBottom: 100,

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

        width: 52,

        height: 52,

        borderRadius: 26,

        backgroundColor: 'rgba(255,255,255,0.15)',

        justifyContent: 'center',

        alignItems: 'center',

    },



    headerTitle: {

        fontSize: 35,

        fontWeight: '800',

        color: '#fff',

        marginTop: 28,

    },



    headerSubtitle: {

        color: '#E9DDFF',

        fontSize: 16,

        marginTop: 10,

        lineHeight: 24,

    },

    profileCard: {

        backgroundColor: '#fff',

        marginHorizontal: 20,

        marginTop: -70,

        borderRadius: 32,

        padding: 22,

        flexDirection: 'row',

        alignItems: 'flex-start',

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 8 },

        shadowOpacity: 0.12,

        shadowRadius: 12,

        elevation: 8,

    },



    logo: {

        width: 88,

        height: 88,

        marginRight: 17,

    },



    profileTextContainer: {

        flex: 1,

        minWidth: 0,

    },



    bandName: {

        fontSize: 23,

        fontWeight: '800',

        color: '#16162E',

    },



    bandSubtitle: {

        color: '#6C4DFF',

        fontSize: 15,

        marginTop: 6,

        fontWeight: '600',

    },



    bandDescription: {

        color: '#666',

        fontSize: 14,

        marginTop: 10,

        lineHeight: 21,

    },



    verifiedBadge: {

        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor: '#6C4DFF',

        alignSelf: 'flex-start',

        paddingHorizontal: 13,

        paddingVertical: 8,

        borderRadius: 20,

        marginTop: 13,

    },



    verifiedText: {

        color: '#fff',

        marginLeft: 6,

        fontWeight: '700',

        fontSize: 12,

    },



    errorCard: {

        marginHorizontal: 20,

        marginTop: 16,

        padding: 16,

        borderRadius: 20,

        backgroundColor: '#FFF5F5',

        borderWidth: 1,

        borderColor: '#FECACA',

        flexDirection: 'row',

        alignItems: 'center',

    },



    errorTextContainer: {

        flex: 1,

        marginHorizontal: 10,

    },



    errorTitle: {

        color: '#B91C1C',

        fontSize: 14,

        fontWeight: '800',

    },



    errorMessage: {

        color: '#7F1D1D',

        fontSize: 12,

        marginTop: 3,

    },



    retryButton: {

        paddingHorizontal: 12,

        paddingVertical: 8,

        borderRadius: 10,

        backgroundColor: '#EF4444',

    },



    retryText: {

        color: '#fff',

        fontWeight: '700',

        fontSize: 12,

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

        paddingVertical: 18,

        paddingHorizontal: 8,

        marginBottom: 14,

        alignItems: 'center',

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.08,

        shadowRadius: 8,

        elevation: 4,

    },



    statIcon: {

        width: 56,

        height: 56,

        borderRadius: 28,

        justifyContent: 'center',

        alignItems: 'center',

    },



    statValue: {

        fontSize: 23,

        fontWeight: '800',

        color: '#16162E',

        marginTop: 11,

    },



    statLabel: {

        textAlign: 'center',

        color: '#666',

        fontSize: 11,

        marginTop: 5,

        lineHeight: 15,

    },



    sectionHeadingRow: {

        marginTop: 18,

        paddingHorizontal: 20,

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'flex-end',

    },



    sectionHeading: {

        fontSize: 23,

        fontWeight: '800',

        color: '#16162E',

    },



    sectionHeadingSubtitle: {

        fontSize: 13,

        color: '#777',

        marginTop: 4,

    },



    adminBadge: {

        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor: '#EEEAFE',

        borderRadius: 15,

        paddingHorizontal: 10,

        paddingVertical: 7,

    },



    adminBadgeText: {

        color: '#5B3DF5',

        fontSize: 10,

        fontWeight: '800',

        marginLeft: 4,

    },



    sectionContainer: {

        marginTop: 14,

        paddingHorizontal: 20,

    },



    sectionWrapper: {

        marginBottom: 14,

    },



    sectionCard: {

        backgroundColor: '#fff',

        borderRadius: 24,

        padding: 18,

        flexDirection: 'row',

        alignItems: 'center',

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.08,

        shadowRadius: 8,

        elevation: 4,

    },



    sectionIcon: {

        width: 58,

        height: 58,

        borderRadius: 19,

        justifyContent: 'center',

        alignItems: 'center',

        marginRight: 15,

    },



    sectionTextContainer: {

        flex: 1,

        minWidth: 0,

    },



    sectionTitle: {

        fontSize: 19,

        fontWeight: '700',

        color: '#16162E',

    },



    sectionSubtitle: {

        color: '#666',

        fontSize: 13,

        marginTop: 5,

        lineHeight: 18,

    },



    sectionCountRow: {

        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 7,

    },



    countDot: {

        width: 7,

        height: 7,

        borderRadius: 4,

        marginRight: 6,

    },



    sectionCount: {

        fontSize: 11,

        color: '#888',

        fontWeight: '600',

    },



    expandedContent: {

        marginTop: 8,

        backgroundColor: '#fff',

        borderRadius: 22,

        padding: 14,

        borderWidth: 1,

        borderColor: '#EEEAF7',

    },



    contentItem: {

        padding: 14,

        borderRadius: 17,

        backgroundColor: '#FAF9FD',

        marginBottom: 10,

        borderWidth: 1,

        borderColor: '#F0EDF7',

    },



    contentImage: {

        width: '100%',

        height: 170,

        borderRadius: 13,

        marginBottom: 12,

    },



    contentItemHeader: {

        flexDirection: 'row',

        alignItems: 'flex-start',

    },



    contentBullet: {

        width: 8,

        height: 8,

        borderRadius: 4,

        marginTop: 7,

        marginRight: 9,

    },



    contentItemTitleContainer: {

        flex: 1,

    },



    contentItemTitle: {

        fontSize: 16,

        fontWeight: '800',

        color: '#242238',

    },



    contentItemSubtitle: {

        fontSize: 12,

        color: '#777',

        marginTop: 3,

        lineHeight: 17,

    },



    contentText: {

        color: '#555',

        fontSize: 14,

        lineHeight: 21,

        marginTop: 10,

    },



    detailsBox: {

        marginTop: 12,

        backgroundColor: '#fff',

        borderRadius: 13,

        padding: 10,

    },



    detailRow: {

        paddingVertical: 7,

        borderBottomWidth: 1,

        borderBottomColor: '#F0EDF7',

    },



    detailKey: {

        color: '#6C4DFF',

        fontSize: 11,

        fontWeight: '800',

        textTransform: 'capitalize',

    },



    detailValue: {

        color: '#555',

        fontSize: 13,

        lineHeight: 19,

        marginTop: 3,

    },



    adminItemActions: {

        flexDirection: 'row',

        marginTop: 12,

        gap: 8,

    },



    editSmallButton: {

        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor: '#EEEAFE',

        paddingHorizontal: 12,

        paddingVertical: 8,

        borderRadius: 10,

    },



    editSmallText: {

        color: '#5B3DF5',

        fontWeight: '700',

        fontSize: 12,

        marginLeft: 5,

    },



    deleteSmallButton: {

        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor: '#FFF0F0',

        paddingHorizontal: 12,

        paddingVertical: 8,

        borderRadius: 10,

    },



    deleteSmallText: {

        color: '#EF4444',

        fontWeight: '700',

        fontSize: 12,

        marginLeft: 5,

    },



    emptyContent: {

        alignItems: 'center',

        paddingVertical: 25,

        paddingHorizontal: 15,

    },



    emptyTitle: {

        color: '#555',

        fontSize: 15,

        fontWeight: '800',

        marginTop: 8,

    },



    emptySubtitle: {

        color: '#999',

        fontSize: 12,

        textAlign: 'center',

        lineHeight: 18,

        marginTop: 4,

    },



    addContentButton: {

        minHeight: 46,

        borderWidth: 1.5,

        borderStyle: 'dashed',

        borderRadius: 13,

        justifyContent: 'center',

        alignItems: 'center',

        flexDirection: 'row',

        marginTop: 4,

    },



    addContentText: {

        fontSize: 13,

        fontWeight: '800',

        marginLeft: 7,

    },



    footerSpace: {

        height: 100,

    },



    modalOverlay: {

        flex: 1,

        backgroundColor: 'rgba(12, 9, 25, 0.55)',

        justifyContent: 'flex-end',

    },



    modalCard: {

        backgroundColor: '#fff',

        maxHeight: '92%',

        borderTopLeftRadius: 30,

        borderTopRightRadius: 30,

        padding: 20,

    },



    modalHeader: {

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'center',

        marginBottom: 18,

    },



    modalTitle: {

        fontSize: 22,

        fontWeight: '800',

        color: '#17152A',

    },



    modalSubtitle: {

        fontSize: 12,

        color: '#777',

        marginTop: 3,

    },



    closeButton: {

        width: 42,

        height: 42,

        borderRadius: 21,

        backgroundColor: '#F3F1F7',

        alignItems: 'center',

        justifyContent: 'center',

    },



    selectedSectionCard: {

        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor: '#F8F6FF',

        borderWidth: 1,

        borderColor: '#E7E1FA',

        borderRadius: 16,

        padding: 13,

        marginBottom: 16,

    },



    selectedSectionIcon: {

        width: 48,

        height: 48,

        borderRadius: 15,

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 12,

    },



    selectedSectionText: {

        flex: 1,

    },



    selectedSectionLabel: {

        color: '#8A8398',

        fontSize: 10,

        fontWeight: '700',

        textTransform: 'uppercase',

        letterSpacing: 0.6,

    },



    selectedSectionTitle: {

        color: '#211B35',

        fontSize: 16,

        fontWeight: '800',

        marginTop: 2,

    },



    selectedSectionHint: {

        color: '#8A8398',

        fontSize: 11,

        marginTop: 3,

    },



    fieldHelperText: {

        color: '#9A94A8',

        fontSize: 10.5,

        lineHeight: 15,

        marginTop: 5,

    },



    formSectionCard: {

        backgroundColor: '#FAF9FF',

        borderWidth: 1,

        borderColor: '#E9E5F5',

        borderRadius: 16,

        padding: 13,

        marginBottom: 15,

    },



    formSectionHeader: {

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: 13,

    },



    formSectionHint: {

        color: '#918A9F',

        fontSize: 11,

        marginTop: 3,

    },



    formField: {

        marginBottom: 15,

    },



    formLabel: {

        color: '#373347',

        fontSize: 13,

        fontWeight: '800',

        marginBottom: 7,

        textTransform: 'capitalize',

    },



    input: {

        minHeight: 48,

        borderWidth: 1,

        borderColor: '#E2DFEA',

        borderRadius: 13,

        paddingHorizontal: 14,

        color: '#242238',

        fontSize: 14,

        backgroundColor: '#FCFBFE',

    },



    multilineInput: {

        minHeight: 100,

        paddingTop: 12,

    },



    multilineInputLarge: {

        minHeight: 140,

        paddingTop: 12,

    },



    formSectionTitle: {

        fontSize: 17,

        fontWeight: '800',

        color: '#17152A',

        marginTop: 5,

        marginBottom: 13,

    },



    sectionPicker: {

        gap: 8,

    },



    sectionPickerItem: {

        borderWidth: 1,

        borderColor: '#E2DFEA',

        borderRadius: 11,

        paddingHorizontal: 12,

        paddingVertical: 10,

        backgroundColor: '#FCFBFE',

    },



    sectionPickerText: {

        color: '#666',

        fontSize: 13,

        fontWeight: '600',

    },



    switchRow: {

        flexDirection: 'row',

        alignItems: 'center',

        paddingVertical: 10,

        marginBottom: 12,

    },



    switchDescription: {

        color: '#999',

        fontSize: 11,

        marginTop: -3,

    },



    saveButton: {

        minHeight: 52,

        borderRadius: 15,

        backgroundColor: '#5B3DF5',

        flexDirection: 'row',

        justifyContent: 'center',

        alignItems: 'center',

        marginTop: 5,

    },



    saveButtonText: {

        color: '#fff',

        fontSize: 15,

        fontWeight: '800',

        marginLeft: 8,

    },

}) as any;
