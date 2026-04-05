import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

type AttendanceType = 'practice' | 'khidmat';

interface AttendanceRecord {
  attendance_id: string;
  user_id: string;
  attendance_type: string;
  date: string;
  status: string;
  marked_by: string;
}

interface AttendanceStats {
  records: AttendanceRecord[];
  total: number;
  present: number;
  percentage: number;
}

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AttendanceType>('practice');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [attendanceData, setAttendanceData] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [activeTab, selectedMonth]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(
        `${BACKEND_URL}/api/attendance/my/${activeTab}?month=${selectedMonth}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthDays = () => {
    const start = startOfMonth(parseISO(selectedMonth + '-01'));
    const end = endOfMonth(parseISO(selectedMonth + '-01'));
    return eachDayOfInterval({ start, end });
  };

  const getAttendanceStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendanceData?.records.find((r) => r.date === dateStr);
    return record?.status || 'unmarked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#4CAF50';
      case 'absent':
        return '#F44336';
      default:
        return '#E0E0E0';
    }
  };

  const renderCalendar = () => {
    const days = getMonthDays();
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <View style={styles.calendar}>
        <View style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => {
              const status = getAttendanceStatus(day);
              return (
                <View
                  key={dayIndex}
                  style={[
                    styles.day,
                    { backgroundColor: getStatusColor(status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      status !== 'unmarked' && styles.dayTextMarked,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'practice' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('practice')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'practice' && styles.activeTabText,
            ]}
          >
            Practice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'khidmat' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('khidmat')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'khidmat' && styles.activeTabText,
            ]}
          >
            Khidmat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() => {
            const date = parseISO(selectedMonth + '-01');
            date.setMonth(date.getMonth() - 1);
            setSelectedMonth(format(date, 'yyyy-MM'));
          }}
        >
          <Text style={styles.monthButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const date = parseISO(selectedMonth + '-01');
            date.setMonth(date.getMonth() + 1);
            setSelectedMonth(format(date, 'yyyy-MM'));
          }}
        >
          <Text style={styles.monthButton}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      {attendanceData && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{attendanceData.total}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {attendanceData.present}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#5B4FCE' }]}>
              {attendanceData.percentage.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Percentage</Text>
          </View>
        </View>
      )}

      {/* Calendar */}
      {loading ? (
        <ActivityIndicator size="large" color="#5B4FCE" style={styles.loader} />
      ) : (
        renderCalendar()
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E0E0E0' }]} />
          <Text style={styles.legendText}>Not Marked</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#5B4FCE',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthButton: {
    fontSize: 20,
    color: '#5B4FCE',
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  calendar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  dayTextMarked: {
    color: '#fff',
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  loader: {
    marginVertical: 40,
  },
});
