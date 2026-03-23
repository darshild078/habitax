import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, RefreshControl
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HabitCard from '../components/HabitCard';
import DashboardCard from '../components/DashboardCard';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDateString() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getAvatarColor(name) {
  const palette = ['#F97316','#EF4444','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EC4899','#6366F1'];
  if (!name) return palette[0];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

export default function HomeScreen({ goToAdd, goToLogin, goToEdit, goToProfile }) {
  const [dashboard, setDashboard] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [networkError, setNetworkError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, habitRes] = await Promise.all([
        API.get('/habits/dashboard'),
        API.get('/habits/get'),
      ]);
      setDashboard(dashRes.data);
      setHabits(habitRes.data);
      setNetworkError(false);
    } catch (err) {
      if (!err.response) setNetworkError(true);
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Fetch user name for avatar
    API.get('/auth/profile').then(res => setUserName(res.data.name || '')).catch(() => {});
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/habits/delete/${id}`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Could not delete habit.');
    }
  };

  const handleEdit = (habit) => {
    goToEdit(habit);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
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

      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.date}>{getDateString()}</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Profile avatar */}
          <TouchableOpacity onPress={goToProfile} style={styles.avatarBtn}>
            <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(userName) }]}>
              <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
            </View>
          </TouchableOpacity>
          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Network error banner */}
      {networkError && (
        <View style={styles.networkBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
          <Text style={styles.networkBannerText}>No internet connection — showing cached data</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Dashboard */}
        <DashboardCard dashboard={dashboard} />

        {/* Habits Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{habits.length}</Text>
          </View>
        </View>

        {/* Empty state */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>🌱</Text>
            </View>
            <Text style={styles.emptyTitle}>Nothing taxing you yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first drain. See what it really costs your life.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={goToAdd}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.emptyBtnText}>Log My First Tax</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Habit Cards */}
        {habits.map((habit) => (
          <HabitCard
            key={habit._id}
            habit={habit}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={goToAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={32} color={colors.textOnPrimary} />
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
  loadingEmoji: { fontSize: 48, marginBottom: spacing.md },
  loadingText: { ...typography.body, color: colors.textSecondary },

  // Header (fixed outside scroll)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#333333',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  networkBannerText: {
    ...typography.caption,
    color: '#FFFFFF',
    flex: 1,
  },
  avatarBtn: {
    marginRight: 2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: colors.accentGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyEmoji: { fontSize: 48 },
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
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  emptyBtnText: {
    ...typography.label,
    color: colors.primary,
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
});