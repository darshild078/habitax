import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, RefreshControl, Image
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

export default function HomeScreen({ goToAdd, goToLogin, goToEdit, goToProfile, goToTracker }) {
  const [dashboard, setDashboard] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [energyOrbs, setEnergyOrbs] = useState(0);
  const [groupSummary, setGroupSummary] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, habitRes, groupRes] = await Promise.all([
        API.get('/habits/dashboard'),
        API.get('/habits/get'),
        API.get('/groups').catch(() => ({ data: { groups: [], invites: [] } })),
      ]);
      setDashboard(dashRes.data);
      setHabits(habitRes.data);
      // Extract yesterday's group status for summary
      if (groupRes.data.groups && groupRes.data.groups.length > 0) {
        const summaries = groupRes.data.groups.slice(0, 1).map(g => ({
          name: g.name,
          totalMembers: g.members?.length || 0,
          completed: g.todayStatus?.filter(m => m.done).length || 0,
          streak: g.groupStreak || 0
        }));
        setGroupSummary(summaries[0] || null);
      }
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
    // Fetch user profile (name + orbs)
    API.get('/auth/profile').then(res => {
      setUserName(res.data.name || '');
      setEnergyOrbs(res.data.energyOrbs ?? 0);
    }).catch(() => {});
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
          {/* Orb counter */}
          <View style={styles.orbPill}>
            <Text style={styles.orbPillIcon}>⚡</Text>
            <Text style={styles.orbPillCount}>{energyOrbs}</Text>
          </View>
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

        {/* Daily Group Summary Card */}
        {groupSummary && (
          <View style={styles.summarycardContainer}>
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryCardTitle}>Group Status</Text>
              <View style={[styles.streakBadge, { backgroundColor: groupSummary.completed === groupSummary.totalMembers ? '#10B981' : '#F59E0B' }]}>
                <Text style={styles.streakBadgeText}>{groupSummary.streak}d</Text>
              </View>
            </View>
            <Text style={styles.summaryCardText}>
              {groupSummary.name}: {groupSummary.completed}/{groupSummary.totalMembers} members completed
            </Text>
            {groupSummary.completed < groupSummary.totalMembers && (
              <Text style={styles.summaryCardWarning}>⚠️ {groupSummary.totalMembers - groupSummary.completed} member(s) still need to complete</Text>
            )}
            {groupSummary.completed === groupSummary.totalMembers && (
              <Text style={styles.summaryCardGood}>✅ Great! Everyone completed today</Text>
            )}
          </View>
        )}

        {/* Track Today Banner */}
        <TouchableOpacity
          style={styles.trackBanner}
          onPress={goToTracker}
          activeOpacity={0.85}
        >
          <View style={styles.trackBannerLeft}>
            <Text style={styles.trackBannerEmoji}>📅</Text>
            <View>
              <Text style={styles.trackBannerTitle}>Track Today</Text>
              <Text style={styles.trackBannerSub}>Mark habits done &amp; build streaks</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

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
  orbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDE7',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFE082',
    gap: 3,
  },
  orbPillIcon: { fontSize: 14 },
  orbPillCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F57F17',
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

  // Track Today Banner
  trackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFD9B8',
  },
  trackBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  trackBannerEmoji: { fontSize: 28 },
  trackBannerTitle: {
    ...typography.label,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: 2,
  },
  trackBannerSub: {
    ...typography.caption,
    color: colors.primary,
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

  // Summary Card
  summarycardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.soft,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryCardTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  streakBadgeText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
    fontSize: 10,
  },
  summaryCardText: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  summaryCardWarning: {
    ...typography.caption,
    color: '#F59E0B',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  summaryCardGood: {
    ...typography.caption,
    color: '#10B981',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});