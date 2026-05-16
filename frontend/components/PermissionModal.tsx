import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { updateUserPermissions } from '../services/adminService';

interface Props {

    visible: boolean;

    user: any;

    onClose: () => void;

    onSave?: () => void;
}

export default function PermissionModal({
    visible,
    user,
    onClose,
    onSave,
}: Props) {

    const [loading, setLoading] = useState(false);

    const [permissions, setPermissions] = useState({
        attendance: false,
        inventory: false,
        fees: false,
        uniforms: false,
        members: false,
    });

    useEffect(() => {

        if (user) {

            setPermissions({

                attendance:
                    user.permissions?.attendance || false,

                inventory:
                    user.permissions?.inventory || false,

                fees:
                    user.permissions?.fees || false,

                uniforms:
                    user.permissions?.uniforms || false,

                members:
                    user.permissions?.members || false,
            });
        }

    }, [user]);

    const togglePermission = (key: keyof typeof permissions) => {

        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key],
        }));

    };

    const handleSave = async () => {

        try {

            setLoading(true);

            const response = await updateUserPermissions(
                user.user_id,
                permissions
            );

            Alert.alert(
                'Success',
                response.message || 'Permissions updated successfully'
            );
            onSave?.();
            onClose();

        } catch (error) {

            console.log(error);

            Alert.alert(
                'Error',
                'Failed to update permissions'
            );

        } finally {

            setLoading(false);

        }

    };

    const permissionItems = [
        {
            key: 'attendance',
            label: 'Attendance Access',
            icon: 'calendar',
        },
        {
            key: 'inventory',
            label: 'Inventory Access',
            icon: 'cube',
        },
        {
            key: 'fees',
            label: 'Fees Access',
            icon: 'cash',
        },
        {
            key: 'uniforms',
            label: 'Uniforms Access',
            icon: 'shirt',
        },
        {
            key: 'members',
            label: 'Members Management',
            icon: 'people',
        },
    ];

    return (

        <Modal
            visible={visible}
            animationType="slide"
            transparent
        >

            <View style={styles.overlay}>

                <View style={styles.modalContainer}>

                    <LinearGradient
                        colors={['#7B2FF7', '#9D4EDD']}
                        style={styles.header}
                    >

                        <Text style={styles.title}>
                            Manage Permissions
                        </Text>

                        <Text style={styles.subtitle}>
                            {user?.name}
                        </Text>

                    </LinearGradient>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                    >

                        {permissionItems.map((item) => (

                            <View
                                key={item.key}
                                style={styles.permissionCard}
                            >

                                <View style={styles.leftSection}>

                                    <View style={styles.iconContainer}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={20}
                                            color="#7B2FF7"
                                        />
                                    </View>

                                    <Text style={styles.permissionLabel}>
                                        {item.label}
                                    </Text>

                                </View>

                                <Switch
                                    value={
                                        permissions[
                                        item.key as keyof typeof permissions
                                        ]
                                    }
                                    onValueChange={() =>
                                        togglePermission(
                                            item.key as keyof typeof permissions
                                        )
                                    }
                                />

                            </View>

                        ))}

                    </ScrollView>

                    <View style={styles.footer}>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >

                            <Text style={styles.cancelText}>
                                Cancel
                            </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            activeOpacity={0.8}
                        >

                            <LinearGradient
                                colors={['#7B2FF7', '#9D4EDD']}
                                style={styles.saveButton}
                            >

                                {loading ? (

                                    <ActivityIndicator color="#fff" />

                                ) : (

                                    <Text style={styles.saveText}>
                                        Save Permissions
                                    </Text>

                                )}

                            </LinearGradient>

                        </TouchableOpacity>

                    </View>

                </View>

            </View>

        </Modal>

    );

}

const styles = StyleSheet.create({

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },

    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        maxHeight: '85%',
    },

    header: {
        padding: 24,
    },

    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },

    subtitle: {
        color: '#E9D5FF',
        marginTop: 6,
        fontSize: 15,
    },

    permissionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    permissionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#222',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },

    cancelButton: {
        flex: 1,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelText: {
        color: '#555',
        fontWeight: '600',
    },

    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    saveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

});