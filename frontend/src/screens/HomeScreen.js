import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import API from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HabitCard from '../components/HabitCard';
import DashboardCard from '../components/DashboardCard';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDateString() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeScreen({ goToAdd, goToLogin }) {
  const [dashboard, setDashboard] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, habitRes] = await Promise.all([
        API.get('/habits/dashboard'),
        API.get('/habits/get'),
      ]);
      setDashboard(dashRes.data);
      setHabits(habitRes.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/habits/delete/${id}`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Could not delete habit.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          goToLogin();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>⏳</Text>
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.date}>{getDateString()}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Card */}
        <DashboardCard dashboard={dashboard} />

        {/* Habits Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          <Text style={styles.habitCount}>{habits.length} tracked</Text>
        </View>

        {/* Empty state */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to track your first habit and see what it's really costing you.
            </Text>
          </View>
        )}

        {/* Habit Cards */}
        {habits.map((habit) => (
          <HabitCard key={habit._id} habit={habit} onDelete={handleDelete} />
        ))}

        {/* Bottom padding for FAB */}
        <View style={{ height: 88 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={goToAdd} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.title,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  habitCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.medium,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.textOnPrimary,
    lineHeight: 38,
    fontWeight: '300',
  },
});