 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
 import { SafeAreaView } from 'react-native-safe-area-context';
 
interface WeekDay {
  day: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  status: 'planned' | 'completed' | 'coming_soon';
  time: string;
}

const TogetherActivitiesScreen = () => {
 
  const [currentWeek, setCurrentWeek] = useState<WeekDay[]>([]);

  
  const activitiesData: { 
    planned: Activity[], 
    completed: Activity[], 
    comingSoon: Activity[] 
  } = {
    planned: [
      {
        id: 1,
        title: 'Listen Together',
        description: 'Make a dry ramen vegan for dinner',
        status: 'planned',
        time: 'Today, 7:00 PM'
      }
    ],
    completed: [
      {
        id: 2,
        title: 'Watch together',
        description: 'Make for a lunch time',
        status: 'completed',
        time: 'Yesterday'
      },
      {
        id: 3,
        title: 'play together',
        description: 'Exercise running at park center',
        status: 'completed',
        time: '2 days ago'
      }
    ],
    comingSoon: [
      {
        id: 4,
        title: 'Some other features',
        description: 'Coming soon!!!',
        status: 'coming_soon',
        time: 'Next week'
      }
    ]
  };

  
  const getCurrentWeek = (): WeekDay[] => {
    const today = new Date();
    const currentDay = today.getDay();
    
    const monday = new Date(today);
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const weekDays: WeekDay[] = [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      weekDays.push({
        day: dayLabels[i],
        date: date.getDate().toString().padStart(2, '0'),
        fullDate: date,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return weekDays;
  };

  useEffect(() => {
    const week = getCurrentWeek();
    setCurrentWeek(week);
  }, []);

  
  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };
  const renderActivityItem = (activity: Activity, index: number) => {
    let statusColor = '#666666';
    let statusText = '';

    switch (activity.status) {
      case 'planned':
        statusColor = '#FFA500';  
        statusText = 'Planned';
        break;
      case 'completed':
        statusColor = '#4CAF50';  
        statusText = 'Completed';
        break;
      case 'coming_soon':
        statusColor = '#2196F3';  
        statusText = 'Coming soon!!!';
        break;
    }
    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.time}>{getCurrentTime()}</Text>
        <Text style={styles.title}>Together Activities</Text>
      </View>

      <View style={styles.calendarContainer}>
        {currentWeek.map((item: WeekDay, index: number) => (
          <View key={index} style={styles.dayContainer}>
            <Text style={styles.dayLabel}>{item.day}</Text>
            <View style={[styles.dateCircle, item.isToday && styles.activeDateCircle]}>
              <Text style={[styles.dateText, item.isToday && styles.activeDateText]}>
                {item.date}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Activities List */}
      <ScrollView style={styles.activitiesContainer} showsVerticalScrollIndicator={false}>
        {/* Planned Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planned</Text>
          {activitiesData.planned.map(renderActivityItem)}
        </View>

        {/* Completed Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed</Text>
          {activitiesData.completed.map(renderActivityItem)}
        </View>

        {/* Coming Soon Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming soon!!!</Text>
          {activitiesData.comingSoon.map(renderActivityItem)}
        </View>

        {/* Empty space at bottom */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEF3',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  time: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
    fontWeight: '400',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    borderRadius: 22,
    paddingVertical: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  activeToggleText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarContainer: {
    marginTop:20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 30,
    paddingTop: 5,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeDateCircle: {
    backgroundColor: '#FF5987',
    borderColor: '#FF5987',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -0.3,
  },
  activeDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activitiesContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  activityItem: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  bottomSpace: {
    height: 30,
  },
});

export default TogetherActivitiesScreen;