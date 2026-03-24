import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, RefreshControl, Animated
} from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getTodayStatus, markHabitDone } from '../services/habitService';
import AchievementToast from '../components/AchievementToast';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

// ── Helpers ───────────────────────────────────────────────────

function getTodayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

function getHabitEmoji(name = '') {
  const n = name.toLowerCase();
  if (n.includes('coffee') || n.includes('tea'))    return '☕';
  if (n.includes('food')   || n.includes('zomato') || n.includes('swiggy')) return '🍔';
  if (n.includes('netflix')|| n.includes('spotify')) return '📺';
  if (n.includes('scroll') || n.includes('instagram')) return '📱';
  if (n.includes('smoke')  || n.includes('cigarette')) return '🚬';
  if (n.includes('gym')    || n.includes('exercise'))  return '🏃';
  return '💡';
}

function streakLabel(n) {
  if (n === 0) return 'Start today';
  return `${n} day${n === 1 ? '' : 's'}`;
}

// ── HabitRow (single check-in row) ───────────────────────────

function HabitRow({ habit, onMark }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (habit.doneToday) return;
    // Quick "pop" animation feedback
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring (scaleAnim, { toValue: 1,    useNativeDriver: true }),
    ]).start();
    onMark(habit._id);
  };

  const done = habit.doneToday;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[styles.row, done && styles.rowDone]}>
        {/* Emoji icon */}
        <View style={[styles.rowIcon, done && styles.rowIconDone]}>
          <Text style={styles.rowEmoji}>{getHabitEmoji(habit.name)}</Text>
        </View>

        {/* Name + streak */}
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, done && styles.rowNameDone]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakText, done && styles.streakTextDone]}>
              {streakLabel(habit.currentStreak)}
            </Text>
            {habit.longestStreak > 0 && (
              <Text style={styles.bestText}>· best {habit.longestStreak}d</Text>
            )}
          </View>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.check, done && styles.checkDone]}
          onPress={handlePress}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {done
            ? <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            : <View style={styles.checkInner} />
          }
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── TrackerScreen ─────────────────────────────────────────────

export default function TrackerScreen({ goBack }) {
  const [habits, setHabits]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking]       = useState(null);
  const [orbToast, setOrbToast]     = useState('');
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showOrbToast = (msg) => {
    setOrbToast(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setOrbToast(''));
  };

  const load = useCallback(async () => {
    try {
      const data = await getTodayStatus();
      setHabits(data);
    } catch (e) {
      console.log('TrackerScreen load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleMark = async (habitId) => {
    if (marking) return; // prevent double-tap mid-flight
    setMarking(habitId);

    // ── Optimistic update — feels instant ──
    setHabits(prev =>
      prev.map(h =>
        h._id === habitId
          ? { ...h, doneToday: true, currentStreak: h.currentStreak + 1 }
          : h
      )
    );

    try {
      const result = await markHabitDone(habitId);
      setHabits(prev =>
        prev.map(h =>
          h._id === habitId
            ? { ...h, doneToday: true,
                currentStreak: result.currentStreak,
                longestStreak: result.longestStreak }
            : h
        )
      );
      // Show milestone or regular orb toast
      if (result.milestone) {
        showOrbToast(`${result.milestone.streak}-day streak! +${result.milestone.totalEarned} orbs! (${result.energyOrbs} total)`);
      } else {
        showOrbToast(`+1 Energy Orb! (${result.energyOrbs ?? '?'} total)`);
      }

      // Phase 3: Show achievement toast if any unlocked
      if (result.newAchievements && result.newAchievements.length > 0) {
        // Show first achievement (queue if multiple)
        setTimeout(() => setCurrentAchievement(result.newAchievements[0]), 2000);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Already logged — keep optimistic state (it's correct)
      } else {
        // Revert on real error
        setHabits(prev =>
          prev.map(h =>
            h._id === habitId
              ? { ...h, doneToday: false, currentStreak: Math.max(0, h.currentStreak - 1) }
              : h
          )
        );
      }
    } finally {
      setMarking(null);
    }
  };

  // Separate done/pending for sorted display (pending first)
  const pending = habits.filter(h => !h.doneToday);
  const done    = habits.filter(h =>  h.doneToday);
  const allDone = habits.length > 0 && pending.length === 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loadingEmoji}>⏳</Text>
          <Text style={styles.loadingText}>Loading today's habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Today's Check-in</Text>
          <Text style={styles.headerDate}>{getTodayLabel()}</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {done.length}/{habits.length}
          </Text>
        </View>
      </View>

      {/* Orb toast */}
      {orbToast !== '' && (
        <Animated.View style={[styles.orbToast, { opacity: fadeAnim }]}>
          <Text style={styles.orbToastText}>{orbToast}</Text>
        </Animated.View>
      )}

      {/* Progress bar */}
      {habits.length > 0 && (
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: `${Math.round((done.length / habits.length) * 100)}%` }
            ]}
          />
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
        {/* All-done celebration */}
        {allDone && (
          <View style={styles.celebrationBanner}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationText}>All habits checked in today!</Text>
          </View>
        )}

        {/* Empty state */}
        {habits.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Add habits from the Home screen first.</Text>
          </View>
        )}

        {/* Pending habits */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>To Do</Text>
            {pending.map(h => (
              <HabitRow key={h._id} habit={h} onMark={handleMark} />
            ))}
          </>
        )}

        {/* Completed habits */}
        {done.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Completed ✅</Text>
            {done.map(h => (
              <HabitRow key={h._id} habit={h} onMark={handleMark} />
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Achievement unlock toast */}
      <AchievementToast
        achievement={currentAchievement}
        onDone={() => setCurrentAchievement(null)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingEmoji: { fontSize: 40, marginBottom: 12 },
  loadingText: { ...typography.body, color: colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.soft,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary },
  headerDate:  { ...typography.caption, color: colors.textSecondary },

  progressPill: {
    marginLeft: 'auto',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  progressText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  progressBarTrack: {
    height: 4,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
    borderRadius: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentGreen,
    borderRadius: 2,
  },

  scroll: { paddingHorizontal: spacing.lg },

  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 11,
  },

  // Habit row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
    gap: spacing.md,
  },
  rowDone: { backgroundColor: colors.accentGreenLight },

  rowIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconDone: { backgroundColor: '#DCF5DC' },
  rowEmoji: { fontSize: 22 },

  rowInfo: { flex: 1 },
  rowName: { ...typography.subheading, color: colors.textPrimary, marginBottom: 4 },
  rowNameDone: { color: colors.textSecondary },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakFire: { fontSize: 12 },
  streakText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  streakTextDone: { color: colors.accentGreen },
  bestText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // Checkbox
  check: {
    width: 32, height: 32, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  checkDone: {
    borderColor: colors.accentGreen,
    backgroundColor: colors.accentGreen,
  },
  checkInner: {
    width: 12, height: 12, borderRadius: 4,
    backgroundColor: colors.border,
  },

  // Celebration
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#F1F8E9',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  celebrationEmoji: { fontSize: 22 },
  celebrationText: { ...typography.label, color: '#388E3C' },

  // Empty
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  // Orb toast (⚡ feedback)
  orbToast: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  orbToastText: {
    ...typography.label,
    color: '#FFE082',
    fontWeight: '700',
    textAlign: 'center',
  },
});
