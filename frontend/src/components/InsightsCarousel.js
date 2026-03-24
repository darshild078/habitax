import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import spacing, { radius, shadow } from '../theme/spacing';
import typography from '../theme/typography';

const WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = WIDTH - spacing.lg * 2 - spacing.md; // Account for padding + gap

/**
 * Single Insight Card
 */
function InsightCard({ icon, iconColor, title, value, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={s.insightCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          s.iconBox,
          { backgroundColor: `${iconColor}20` }, // 20% opacity
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View style={s.insightContent}>
        <Text style={s.insightTitle}>{title}</Text>
        <Text style={s.insightValue}>{value}</Text>
        {subtitle && (
          <Text style={s.insightSubtitle}>{subtitle}</Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

/**
 * InsightsCarousel
 * Horizontal scrollable list of insights
 */
export default function InsightsCarousel({ insights = [] }) {
  if (!insights || insights.length === 0) {
    return (
      <View style={s.container}>
        <Text style={s.emptyText}>No insights yet. Keep logging!</Text>
      </View>
    );
  }

  // Build insight cards from insights data
  const insightCards = [];

  const primary = insights[0]; // Assume first insight is primary

  if (primary) {
    // Best time insight
    if (primary.bestTime) {
      insightCards.push({
        id: 'best-time',
        icon: 'time-outline',
        iconColor: '#8B5CF6',
        title: 'Best Time',
        value: primary.bestTime,
        subtitle: 'You complete most at this time',
      });
    }

    // Weak day insight
    if (primary.worstDay) {
      insightCards.push({
        id: 'weak-day',
        icon: 'alert-circle-outline',
        iconColor: '#F59E0B',
        title: 'Weak Day',
        value: primary.worstDay,
        subtitle: 'Focus here to improve consistency',
      });
    }

    // Failure risk insight
    if (primary.failureRisk !== undefined) {
      const riskLevel =
        primary.failureRisk > 0.6
          ? 'High'
          : primary.failureRisk > 0.3
            ? 'Medium'
            : 'Low';
      const riskColor =
        primary.failureRisk > 0.6
          ? '#EF4444'
          : primary.failureRisk > 0.3
            ? '#F59E0B'
            : '#10B981';

      insightCards.push({
        id: 'failure-risk',
        icon: primary.failureRisk > 0.6 ? 'warning' : 'shield-checkmark-outline',
        iconColor: riskColor,
        title: 'Streak Risk',
        value: riskLevel,
        subtitle: `${Math.round(primary.failureRisk * 100)}% chance to break`,
      });
    }

    // Milestone insight
    if (primary.nextMilestone) {
      insightCards.push({
        id: 'milestone',
        icon: 'flag-outline',
        iconColor: '#3B82F6',
        title: 'Next Milestone',
        value: primary.nextMilestone.target,
        subtitle: `${primary.nextMilestone.daysUntil} days away (${Math.round(
          primary.nextMilestone.probability * 100
        )}% likely)`,
      });
    }

    // Suggested action insight
    if (primary.suggestedAction) {
      const actionLabels = {
        nudge_friend_for_accountability: 'Ask friend for help',
        focus_on_weak_days: 'Master weak days',
        you_can_hit_milestone: 'You can hit the goal!',
      };

      insightCards.push({
        id: 'action',
        icon: 'bulb-outline',
        iconColor: '#10B981',
        title: 'Suggestion',
        value: actionLabels[primary.suggestedAction] || 'Keep going',
        subtitle: 'Follow this to improve faster',
      });
    }
  }

  if (insightCards.length === 0) {
    return (
      <View style={s.container}>
        <Text style={s.emptyText}>Keep logging to unlock insights</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.label}>Insights</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={s.scrollContent}
        snapToInterval={CARD_WIDTH + spacing.md}
        decelerationRate="fast"
      >
        {insightCards.map(card => (
          <View key={card.id} style={{ width: CARD_WIDTH }}>
            <InsightCard
              icon={card.icon}
              iconColor={card.iconColor}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
            />
          </View>
        ))}
      </ScrollView>

      {/* Indicator dots */}
      {insightCards.length > 1 && (
        <View style={s.dotsContainer}>
          <Text style={s.dotsText}>
            Swipe for more insights ←
          </Text>
        </View>
      )}
    </View>
  );
}

// Styles
const s = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.soft,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  insightValue: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '700',
  },
  insightSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
    lineHeight: 13,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  dotsContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  dotsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
});
