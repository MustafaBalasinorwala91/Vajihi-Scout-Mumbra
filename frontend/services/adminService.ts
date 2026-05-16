import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('session_token');

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export const updateUserPermissions = async (
    userId: string,
    permissions: {
        attendance: boolean;
        inventory: boolean;
        fees: boolean;
        uniforms: boolean;
        members: boolean;
    }
) => {
    try {
        const headers = await getHeaders();

        const response = await fetch(
            `${API_URL}/api/admin/update-permissions`,
            {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    user_id: userId,
                    permissions,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.log('UPDATE PERMISSIONS ERROR:', error);
    }
};

export const assignTag = async (
    userId: string,
    tag: string
) => {
    try {
        const headers = await getHeaders();

        const response = await fetch(
            `${API_URL}/api/admin/assign-tag`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    user_id: userId,
                    tag,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.log('ASSIGN TAG ERROR:', error);
    }
};

export const assignBadge = async (
    userId: string,
    badge: string
) => {
    try {
        const headers = await getHeaders();

        const response = await fetch(
            `${API_URL}/api/admin/assign-badge`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    user_id: userId,
                    badge,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.log('ASSIGN BADGE ERROR:', error);
    }
};

export const deleteUser = async (
    userId: string
) => {
    try {
        const headers = await getHeaders();

        const response = await fetch(
            `${API_URL}/api/admin/delete-user/${userId}`,
            {
                method: 'DELETE',
                headers,
            }
        );

        return await response.json();
    } catch (error) {
        console.log('DELETE USER ERROR:', error);
    }
};

export const getUserProfile = async (
    userId: string
) => {
    try {
        const headers = await getHeaders();

        const response = await fetch(
            `${API_URL}/api/admin/user-profile/${userId}`,
            {
                method: 'GET',
                headers,
            }
        );

        return await response.json();
    } catch (error) {
        console.log('GET USER PROFILE ERROR:', error);
    }
};