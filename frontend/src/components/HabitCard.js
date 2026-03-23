import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

// Maps category keywords to icon emoji + color
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

export default function HabitCard({ habit, onDelete }) {
  const { emoji, bg, dot } = getHabitStyle(habit.name);

  const confirmDelete = () => {
    Alert.alert('Delete Habit', `Remove "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(habit._id) },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Text style={styles.iconEmoji}>{emoji}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
          <Text style={styles.cost}>₹{habit.yearlyCost}/yr</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: dot }]} />
            <Text style={[styles.badgeText, { color: dot }]}>
              {frequencyLabel[habit.frequencyType] || habit.frequencyType}
            </Text>
          </View>
          <Text style={styles.insight} numberOfLines={2}>{habit.insight}</Text>
        </View>

        {/* Monthly Cost row */}
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>₹{habit.monthlyCost}/mo</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statItem}>{habit.yearlyHours}h/yr</Text>
        </View>
      </View>

      {/* Delete button — large red circle, easy to tap */}
      <TouchableOpacity
        onPress={confirmDelete}
        style={styles.deleteBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteX}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 4,
    ...shadow.soft,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  habitName: {
    ...typography.subheading,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cost: {
    ...typography.subheading,
    color: colors.danger,
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  insight: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statItem: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statDivider: {
    ...typography.caption,
    color: colors.textMuted,
  },
  // Delete button — visible red pill
  deleteBtn: {
    marginLeft: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.pill,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteX: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 18,
  },
});
