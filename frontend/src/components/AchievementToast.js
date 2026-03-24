import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius } from '../theme/spacing';

/**
 * AchievementToast — slides down from the top when a new achievement unlocks.
 *
 * Usage:
 *   <AchievementToast achievement={{ label, description }} onDone={() => ...} />
 *
 * Set achievement to null/undefined to hide.
 */
export default function AchievementToast({ achievement, onDone }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (achievement) {
      Animated.sequence([
        Animated.spring(slideAnim, { toValue: 50, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        if (onDone) onDone();
      });
    } else {
      slideAnim.setValue(-100);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="trophy" size={20} color="#F57F17" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Achievement Unlocked!</Text>
        <Text style={styles.label}>{achievement.label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFFDE7',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FFE082',
  },
  textWrap: { flex: 1 },
  title: { ...typography.caption, color: '#FFE082', fontWeight: '700', marginBottom: 2 },
  label: { ...typography.label, color: '#FFFFFF' },
});
