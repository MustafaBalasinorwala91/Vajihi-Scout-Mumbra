import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const saveAttendance = async (
    attendanceType: string,
    eventName: string,
    selectedDate: string,
    records: any[]
) => {
    try {
        const token = await AsyncStorage.getItem('session_token');
        if (!token) return;

        const response = await fetch(
            `${API_URL}/api/attendance/bulk`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    attendance_type: attendanceType,
                    event_name: eventName,
                    date: selectedDate,
                    records,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.log('SAVE ATTENDANCE ERROR:', error);
    }
};

export const getAttendanceHistory = async (
    attendanceType: string
) => {
    try {
        const token = await AsyncStorage.getItem('session_token');
        if (!token) return;

        const response = await fetch(
            `${API_URL}/api/attendance/history/${attendanceType}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.error(error);
    }
};

export const getAttendanceHistoryDetails = async (
    sessionId: string
) => {
    try {
        const token = await AsyncStorage.getItem('session_token');
        if (!token) return;

        const response = await fetch(
            `${API_URL}/api/attendance/history-details/${sessionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.log('UPDATE ATTENDANCE ERROR:', error);
    }
};

export const updateAttendanceSession = async (
    sessionId: string,
    records: any[]
) => {
    try {
        const token = await AsyncStorage.getItem('session_token');
        if (!token) return;

        const response = await fetch(
            `${API_URL}/api/attendance/session/${sessionId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    records,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.log('UPDATE ATTENDANCE ERROR:', error);
    }
};

export const deleteAttendanceSession = async (
    sessionId: string
) => {
    try {
        const token = await AsyncStorage.getItem('session_token');
        if (!token) return;

        const response = await fetch(
            `${API_URL}/api/attendance/session/${sessionId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.log('UPDATE ATTENDANCE ERROR:', error);
    }
};