import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius } from '../theme/spacing';

export default function PillSelector({ options, selected, onSelect }) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  pillTextSelected: {
    color: colors.textOnPrimary,
  },
});
