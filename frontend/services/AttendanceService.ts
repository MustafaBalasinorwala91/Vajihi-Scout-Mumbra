import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const saveAttendance = async (
    attendanceType: string,
    selectedDate: string,
    records: any[]
) => {
    try {
        const token = await AsyncStorage.getItem('session_token');

        const response = await fetch(
            `${API_URL}/api/attendance/save`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    attendance_type: attendanceType,
                    selected_date: selectedDate,
                    records,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.log('SAVE ATTENDANCE ERROR:', error);
    }
};

export const getAttendanceHistory = async () => {
    try {
        const token = await AsyncStorage.getItem('session_token');

        const response = await fetch(
            `${API_URL}/api/attendance/history`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return await response.json();
    } catch (error) {
        console.log(error);
    }
};