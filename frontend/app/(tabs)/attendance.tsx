import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import NotificationBell from '../../components/common/NotificationBell';
import AttendanceTab from '../../components/attendance/AttendanceTab';
import AttendanceCard from '../../components/attendance/AttendanceCard';
import CalendarDay from '../../components/attendance/CalendarDay';
import ReminderCard from '../../components/attendance/ReminderCard';

export default function AttendanceScreen() {

  const router = useRouter();

  const [attendanceType, setAttendanceType] =
    useState('practice');

  const [selectedDate, setSelectedDate] =
    useState(
      new Date().toISOString().split('T')[0]
    );
  const [markedDates, setMarkedDates] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      loadAttendanceDates();
      loadAttendanceStats();
    }, [attendanceType])
  );
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const loadAttendanceDates = async () => {

    try {

      const response = await axios.get(
        `${BACKEND_URL}/api/attendance/dates/${attendanceType.toLowerCase()}`
      );

      setMarkedDates(response.data);

    } catch (error) {

      console.log('LOAD DATES ERROR:', error);

    }

  };
  const loadAttendanceStats = async () => {

    try {

      const response = await axios.get(
        `${BACKEND_URL}/api/attendance/history/${attendanceType}`
      );

      const history = response.data;

      let total = history.length;

      let present = 0;

      let absent = 0;

      history.forEach((item: any) => {

        present += item.present;

        absent += item.absent;

      });

      const percentage =
        present + absent > 0
          ? Math.round(
            (present / (present + absent)) * 100
          )
          : 0;

      setStats({
        total,
        present,
        absent,
        percentage,
      });

    } catch (error) {

      console.log(
        'LOAD STATS ERROR:',
        error
      );

    }

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
            label="Total Days"
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
                      width: 44,
                      height: 44,
                    }}
                  />
                );
              }

              const formattedDate =
                `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

              return (
                <CalendarDay
                  key={day}
                  day={day}

                  selected={
                    selectedDate === formattedDate
                  }

                  marked={
                    markedDates.find(
                      item =>
                        item.date === formattedDate &&
                        item.status === 'present'
                    )
                  }

                  absent={
                    markedDates.find(
                      item =>
                        item.date === formattedDate &&
                        item.status === 'absent'
                    )
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

        {/* REMINDER */}
        <ReminderCard />

        {/* VIEW MEMBERS BUTTON */}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() =>
            router.push({
              pathname: '/attendance-members',
              params: {
                attendanceType,
                selectedDate,
              },
            })
          }
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
    gap: 8,
  },

  weekRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginBottom: 18,
  },

  weekText: {
    width: 44,
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

});