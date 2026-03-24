import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

function getHabitStyle(name) {
  const n = name.toLowerCase();
  if (n.includes('coffee') || n.includes('tea'))
    return { emoji: '☕', bg: colors.accentBrownLight, dot: colors.accentBrown };
  if (n.includes('food') || n.includes('takeout') || n.includes('zomato') || n.includes('swiggy'))
    return { emoji: '🍔', bg: colors.accentOrangeLight, dot: '#E65100' };
  if (n.includes('netflix') || n.includes('spotify') || n.includes('subscription'))
    return { emoji: '📺', bg: colors.accentPurpleLight, dot: colors.accentPurple };
  if (n.includes('scroll') || n.includes('instagram') || n.includes('reels'))
    return { emoji: '📱', bg: '#E3F2FD', dot: '#1E88E5' };
  if (n.includes('smoke') || n.includes('cigarette') || n.includes('alcohol'))
    return { emoji: '🚬', bg: colors.dangerLight, dot: colors.danger };
  if (n.includes('gym') || n.includes('exercise') || n.includes('walk'))
    return { emoji: '🏃', bg: colors.accentGreenLight, dot: colors.accentGreen };
  return { emoji: '💰', bg: colors.primaryLight, dot: colors.primary };
}

const frequencyLabel = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function HabitCard({ habit, onDelete, onEdit }) {
  const { emoji, bg, dot } = getHabitStyle(habit.name);

  const confirmDelete = () => {
    Alert.alert('Delete Habit', `Remove "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(habit._id) },
    ]);
  };

  return (
    <View style={styles.card}>

      {/* Top section: icon + main info */}
      <View style={styles.topSection}>
        <View style={[styles.iconCircle, { backgroundColor: bg }]}>
          <Text style={styles.iconEmoji}>{emoji}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: dot }]} />
              <Text style={[styles.badgeText, { color: dot }]}>
                {frequencyLabel[habit.frequencyType] || habit.frequencyType}
              </Text>
            </View>
            <Text style={styles.insight} numberOfLines={1}>{habit.insight}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom section: stats + actions */}
      <View style={styles.bottomSection}>
        {/* Cost stats + streak */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>₹{habit.yearlyCost.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>per year</Text>
          </View>
          <View style={[styles.statChip, { marginHorizontal: spacing.sm }]}>
            <Text style={styles.statValue}>₹{habit.monthlyCost.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>per month</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{habit.yearlyHours}h</Text>
            <Text style={styles.statLabel}>lost/year</Text>
          </View>
          {(habit.currentStreak > 0) && (
            <View style={[styles.statChip, styles.streakChip]}>
              <Text style={styles.streakValue}>🔥 {habit.currentStreak}d</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(habit)}
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm + 4,
    ...shadow.soft,
    overflow: 'hidden',
  },

  // Top
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  habitName: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  insight: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },

  // Bottom
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceAlt,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChip: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  // Streak pill within stats row
  streakChip: {
    marginLeft: spacing.sm,
    backgroundColor: '#FFF3E0',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
