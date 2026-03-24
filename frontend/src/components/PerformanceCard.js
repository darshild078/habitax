import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import spacing, { radius, shadow } from '../theme/spacing';
import typography from '../theme/typography';

/**
 * PerformanceCard
 * Displays weekly completion rate, trend, and behavior tag
 */
export default function PerformanceCard({ insights, onPress }) {
  if (!insights) {
    return (
      <View style={s.card}>
        <Text style={s.emptyText}>Complete habits to see your performance</Text>
      </View>
    );
  }

  const {
    completionRate = 0,
    completionCount = 0,
    targetCount = 7,
    trend = 'stable',
    tag = 'stable',
    nextMilestone,
  } = insights;

  const rate = Math.round(completionRate * 100);

  // Trend icon and color
  const trendConfig = {
    improving: { icon: 'trending-up', color: '#10B981', label: 'Improving' },
    stable: { icon: 'remove-outline', color: '#3B82F6', label: 'Stable' },
    declining: { icon: 'trending-down', color: '#EF4444', label: 'Declining' },
  };

  const trendInfo = trendConfig[trend] || trendConfig.stable;

  // Tag color
  const tagColor = {
    focused: '#8B5CF6',
    improving: '#10B981',
    stable: '#3B82F6',
    inconsistent: '#F59E0B',
  };

  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header: Rate + Trend */}
      <View style={s.header}>
        <View style={s.rateBox}>
          <Text style={s.rateText}>{rate}%</Text>
          <Text style={s.rateLabel}>This Week</Text>
        </View>

        <View style={s.trendBox}>
          <Ionicons name={trendInfo.icon} size={20} color={trendInfo.color} />
          <Text style={[s.trendLabel, { color: trendInfo.color }]}>
            {trendInfo.label}
          </Text>
        </View>
      </View>

      {/* Completion counter */}
      <View style={s.counter}>
        <Text style={s.counterText}>
          {completionCount}/{targetCount} days completed
        </Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressContainer}>
        <View
          style={[
            s.progressBar,
            {
              width: `${rate}%`,
              backgroundColor: trendInfo.color,
            },
          ]}
        />
      </View>

      {/* Behavior tag + milestone */}
      <View style={s.footer}>
        <View
          style={[
            s.tagBadge,
            { backgroundColor: tagColor[tag] || tagColor.stable },
          ]}
        >
          <Text style={s.tagText}>{tag}</Text>
        </View>

        {nextMilestone && (
          <View style={s.milestoneBox}>
            <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
            <Text style={s.milestoneText}>
              {nextMilestone.target}: {nextMilestone.daysUntil}d away
            </Text>
          </View>
        )}
      </View>

      {/* Tap hint */}
      <Text style={s.tapHint}>Tap for detailed insights</Text>
    </TouchableOpacity>
  );
}

// Styles
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.medium,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  rateBox: {
    alignItems: 'center',
  },
  rateText: {
    ...typography.heading,
    fontSize: 36,
    color: colors.primary,
    fontWeight: '900',
  },
  rateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  trendBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  counter: {
    marginBottom: spacing.md,
  },
  counterText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.pill,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
    textTransform: 'capitalize',
    fontSize: 11,
  },
  milestoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  milestoneText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  tapHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
