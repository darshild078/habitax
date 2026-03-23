import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

export default function DashboardCard({ dashboard }) {
  if (!dashboard) return null;

  return (
    <View style={styles.card}>
      {/* Top: total burned */}
      <Text style={styles.label}>You paid this tax 🔥</Text>
      <Text style={styles.bigAmount}>₹{(dashboard.totalYearlyCost || 0).toLocaleString('en-IN')}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{(dashboard.totalMonthlyCost || 0).toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>Per Month</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{dashboard.totalHoursLost || 0}h</Text>
          <Text style={styles.statLabel}>Hours Lost</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{dashboard.totalDaysLost || 0}d</Text>
          <Text style={styles.statLabel}>Days Lost</Text>
        </View>
      </View>

      {/* Worst habit callout */}
      {dashboard.worstHabit && (
        <View style={styles.worstBadge}>
          <Text style={styles.worstIcon}>💀</Text>
          <Text style={styles.worstText} numberOfLines={1}>
            Worst drain: <Text style={styles.worstHighlight}>{dashboard.worstHabit.name}</Text>
            {' '}is bleeding you ₹{(dashboard.worstHabit.yearlyCost || 0).toLocaleString('en-IN')}/yr
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFD9BB',
    ...shadow.soft,
  },
  label: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigAmount: {
    fontFamily: undefined,
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#FFD9BB',
    marginHorizontal: spacing.sm,
  },
  worstBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    gap: spacing.sm,
  },
  worstIcon: {
    fontSize: 18,
  },
  worstText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  worstHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
