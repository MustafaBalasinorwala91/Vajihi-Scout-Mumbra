import { Dimensions } from 'react-native';
import { wp, hp } from '../../utils/responsive';
import { rf } from '../../utils/fonts';
import api from '../../services/api';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../../components/common/NotificationBell';
import AttendanceTab from '../../components/attendance/AttendanceTab';
import AttendanceCard from '../../components/attendance/AttendanceCard';
import CalendarDay from '../../components/attendance/CalendarDay';

export default function AttendanceScreen() {

  const SCREEN_WIDTH = Dimensions.get('window').width;

  const CALENDAR_PADDING = 32;
  const CELL_SIZE =
    Math.floor((SCREEN_WIDTH - 68) / 7);
  const router = useRouter();
  const { user } = useAuth();

  const [attendanceType, setAttendanceType] =
    useState('practice');
  const [eventName, setEventName] =
    useState('Normal Practice');
  const EVENT_OPTIONS = {
    practice: [
      'Normal Practice',
      'Full-Day Practice',
      'Composing Practice',
      'Specific Instrument Practice',
    ],

    khidmat: [
      'Jaman Khidmat',
      'Salwat Takseem',
      'Flow Management',
    ],

    duties: [
      'Local Duty',
      'Milad Duty',
      'Ziyafat Duty',
      '15th August',
      '26th January',
    ],
  };
  useEffect(() => {
    setEventName(
      EVENT_OPTIONS[
      attendanceType as keyof typeof EVENT_OPTIONS
      ][0]
    );
  }, [attendanceType]);

  const [selectedDate, setSelectedDate] =
    useState(
      new Date().toISOString().split('T')[0]
    );
  const [markedDates, setMarkedDates] = useState<any[]>([]);
  const canManageAttendance =
    user?.role === 'admin' ||
    user?.permissions?.attendance;
  useEffect(() => {

    if (!user) return;

    loadAttendanceDates();

    loadAttendanceStats();

  }, [
    user,
    attendanceType,
    canManageAttendance
  ]);

  const [refreshing, setRefreshing] =
    useState(false);

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const loadAttendanceDates = async () => {

    const token =
      await AsyncStorage.getItem(
        'session_token'
      );

    if (!token) return;

    try {

      const response = await api.get(
        `${BACKEND_URL}/api/attendance/dates/${attendanceType.toLowerCase()}`
      );

      setMarkedDates(response.data);

    } catch (error) {

      console.error(error);

    }

  };
  const loadAttendanceStats = async () => {

    const token =
      await AsyncStorage.getItem(
        'session_token'
      );

    if (!token) return;

    try {

      // MEMBER
      if (user?.role !== 'admin') {

        const response = await api.get(
          `${BACKEND_URL}/api/attendance/my-stats/${attendanceType}`
        );

        setStats(response.data);

        return;
      }

      const response = await api.get(
        `${BACKEND_URL}/api/attendance/overall-stats/${attendanceType}`
      );

      setStats({
        total: response.data.sessions,
        present: response.data.present,
        absent: response.data.absent,
        percentage: response.data.percentage,
      });
    } catch (error: any) {

      console.log(
        'STATUS:',
        error?.response?.status
      );

      console.log(
        'DATA:',
        error?.response?.data
      );

      console.log(
        'TOKEN:',
        await AsyncStorage.getItem('session_token')
      );

    }

  };
  const onRefresh = async () => {

    setRefreshing(true);

    await loadAttendanceDates();

    await loadAttendanceStats();

    setRefreshing(false);
  };
  const [currentDate, setCurrentDate] =
    useState(new Date());

  const currentMonth =
    currentDate.getMonth();

  const currentYear =
    currentDate.getFullYear();

  const goToPreviousMonth = () => {

    const newDate = new Date(currentDate);

    newDate.setMonth(
      currentMonth - 1
    );

    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {

    const newDate = new Date(currentDate);

    newDate.setMonth(
      currentMonth + 1
    );

    setCurrentDate(newDate);
  };

  const monthName =
    currentDate.toLocaleString(
      'default',
      {
        month: 'long',
      }
    );

  const totalDays = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const calendarDays = [

    ...Array(firstDayOfMonth).fill(null),

    ...Array.from(
      { length: totalDays },
      (_, i) => i + 1
    ),

  ];

  const handleSelectDay = (day: number) => {

    const formattedDate =
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    setSelectedDate(formattedDate);

  };

  return (

    <View style={styles.container}>

      <ScrollView

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5B3DF5']}
            tintColor="#5B3DF5"
          />
        }

        showsVerticalScrollIndicator={false}

        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >

        {/* HEADER */}
        <LinearGradient
          colors={['#2B145A', '#5B3DF5']}
          style={styles.header}
        >

          <View style={styles.headerTop}>

            <View>

              <Text style={styles.title}>
                Attendance
              </Text>

              <Text style={styles.subtitle}>
                Track, manage and analyze attendance
              </Text>

            </View>

            <NotificationBell />

          </View>

          {/* TABS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsWrapper}
          >

            <AttendanceTab
              label="Practice"
              icon="people"
              active={attendanceType === 'practice'}
              onPress={() =>
                setAttendanceType('practice')
              }
            />

            <AttendanceTab
              label="Khidmat"
              icon="heart"
              active={attendanceType === 'khidmat'}
              onPress={() =>
                setAttendanceType('khidmat')
              }
            />

            <AttendanceTab
              label="Duties"
              icon="clipboard"
              active={attendanceType === 'duties'}
              onPress={() =>
                setAttendanceType('duties')
              }
            />

          </ScrollView>

        </LinearGradient>

        {/* MONTH */}
        {/* MONTH */}
        <View style={styles.monthWrapper}>

          <View style={styles.monthSelector}>

            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={styles.monthArrow}
            >

              <Ionicons
                name="chevron-back"
                size={22}
                color="#fff"
              />

            </TouchableOpacity>

            <View style={styles.monthCenter}>

              <Ionicons
                name="calendar-outline"
                size={24}
                color="#5B3DF5"
              />

              <Text style={styles.monthText}>
                {monthName} {currentYear}
              </Text>

            </View>

            <TouchableOpacity
              onPress={goToNextMonth}
              style={styles.monthArrow}
            >

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#fff"
              />

            </TouchableOpacity>

          </View>

        </View>
        {/* SUMMARY */}
        {/* SUMMARY */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >

          <AttendanceCard
            icon="calendar"
            value={String(stats.total)}
            label={
              user?.role === 'admin'
                ? "Sessions"
                : "Total"
            }
            color="#7B61FF"
          />

          <AttendanceCard
            icon="checkmark-circle"
            value={String(stats.present)}
            label="Present"
            color="#37C978"
          />

          <AttendanceCard
            icon="close-circle"
            value={String(stats.absent)}
            label="Absent"
            color="#FF5B5B"
          />

          <AttendanceCard
            icon="pie-chart"
            value={`${stats.percentage}%`}
            label="Percentage"
            color="#7B61FF"
          />

        </ScrollView>

        {/* CALENDAR */}
        <View style={styles.calendarContainer}>

          <View style={styles.weekRow}>
            {[
              'Sun',
              'Mon',
              'Tue',
              'Wed',
              'Thu',
              'Fri',
              'Sat',
            ].map((day) => (
              <Text
                style={styles.weekText}
                key={day}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {

              if (day === null) {
                return (
                  <View
                    key={`empty-${index}`}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  />
                );
              }

              const formattedDate =
                `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const attendance =
                markedDates.find(
                  (item) => item.date === formattedDate
                );

              return (
                <CalendarDay
                  key={day}
                  day={day}
                  size={CELL_SIZE}
                  selected={
                    selectedDate === formattedDate
                  }
                  presentCount={
                    attendance?.presentCount ||
                    (attendance?.present ? 1 : 0)
                  }
                  absentCount={
                    attendance?.absentCount ||
                    (attendance?.absent ? 1 : 0)
                  }
                  onPress={() => handleSelectDay(day)}
                />
              );

            })}
          </View>

        </View>

        {/* LEGEND */}
        <View style={styles.legendContainer}>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: '#37C978',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Present
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: '#FF3B30',
                },
              ]}
            />

            <Text style={styles.legendText}>
              Absent
            </Text>
          </View>

        </View>
        {canManageAttendance && (
          <View style={styles.eventCard}>

            <Text style={styles.eventTitle}>
              Select Event
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {EVENT_OPTIONS[
                attendanceType as keyof typeof EVENT_OPTIONS
              ].map((item) => (

                <TouchableOpacity
                  key={item}
                  style={[
                    styles.eventChip,
                    eventName === item &&
                    styles.eventChipActive,
                  ]}
                  onPress={() => setEventName(item)}
                >

                  <Text
                    style={[
                      styles.eventChipText,
                      eventName === item &&
                      styles.eventChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                </TouchableOpacity>

              ))}
            </ScrollView>

          </View>
        )}

        {/* VIEW MEMBERS BUTTON */}
        {canManageAttendance && (

          <TouchableOpacity

            style={styles.viewButton}

            onPress={() => {

              router.push({
                pathname: '/attendance-members',
                params: {
                  attendanceType,
                  selectedDate,
                  eventName,
                },
              });

            }}
          >

            <LinearGradient
              colors={['#6C4DFF', '#5B3DF5']}
              style={styles.viewGradient}
            >

              <Ionicons
                name="people-outline"
                size={22}
                color="#fff"
              />

              <Text style={styles.viewText}>
                View Members
              </Text>

            </LinearGradient>

          </TouchableOpacity>
        )}

        <View style={styles.historyButtonsContainer}>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() =>
              router.push(
                `/attendance-history?type=${attendanceType}`
              )
            }
          >
            <Ionicons
              name="time-outline"
              size={22}
              color="#fff"
            />

            <Text style={styles.historyButtonText}>
              View {attendanceType} History
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView >

    </View >
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 65,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.82)',
  },

  tabsWrapper: {
    marginTop: 28,
    paddingBottom: 4,
  },

  monthWrapper: {
    marginTop: -22,
    paddingHorizontal: 18,
    zIndex: 20,
  },

  monthSelector: {

    backgroundColor: '#fff',

    height: 72,

    borderRadius: 24,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 18,

    shadowColor: '#000',

    shadowOpacity: 0.05,

    shadowRadius: 10,

    elevation: 4,
  },
  monthCenter: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    flex: 1,

    justifyContent: 'center',
  },

  monthArrow: {

    width: 44,

    height: 44,

    borderRadius: 16,

    backgroundColor: '#5B3DF5',

    justifyContent: 'center',

    alignItems: 'center',
  },

  monthText: {

    fontSize: 20,

    fontWeight: '800',

    color: '#16162E',
  },

  summaryRow: {
    paddingHorizontal: 18,
    marginTop: 20,
    paddingBottom: 4,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginTop: 24,
    marginHorizontal: 18,
    borderRadius: 34,
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  weekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
  },

  legendContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 10,
    marginRight: 8,
  },

  legendText: {
    fontSize: 15,
    color: '#444',
  },

  viewButton: {
    marginTop: 30,
    marginHorizontal: 18,
  },

  viewGradient: {
    height: 60,
    borderRadius: 20,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    gap: 10,
  },

  viewText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  historyButtonsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  historyButton: {
    height: 62,
    borderRadius: 24,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#5B3DF5',

    shadowColor: '#5B3DF5',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  historyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  eventCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4.5),
    marginTop: hp(2.2),
    borderRadius: wp(6),
    padding: wp(4.5),

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  eventTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#16162E',
    marginBottom: hp(1.5),
  },

  eventChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: wp(5),
    backgroundColor: '#F3F0FF',
    marginRight: wp(2.5),
    minHeight: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventChipActive: {
    backgroundColor: '#5B3DF5',
  },

  eventChipText: {
    color: '#5B3DF5',
    fontWeight: '600',
    fontSize: rf(13),
  },

  eventChipTextActive: {
    color: '#fff',
  },

});