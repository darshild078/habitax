import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Animated, Image } from 'react-native';
import { useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius } from '../theme/spacing';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('../../assets/onboarding_cost.png'),
    title: 'See the real cost',
    subtitle: "Every daily habit has a hidden yearly price tag. Coffee? Rs.73,000/year. We'll show you the truth.",
  },
  {
    image: require('../../assets/onboarding_time.png'),
    title: 'Time is money too',
    subtitle: "You're not just burning cash - you're burning hours. We track both so you see the full picture.",
  },
  {
    image: require('../../assets/onboarding_insight.png'),
    title: 'Get savage insights',
    subtitle: "You burned more than a month of rent. Cold, honest, motivating. That's HabiTax.",
  },
];

export default function OnboardingScreen({ goToLogin }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleDone = async () => {
    await AsyncStorage.setItem('onboarded', 'true');
    goToLogin();
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip */}
      <TouchableOpacity onPress={handleDone} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isActive
                  ? { backgroundColor: colors.primary, width: 24 }
                  : { backgroundColor: colors.border, width: 8 },
              ]}
            />
          );
        })}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={isLast ? handleDone : handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  slideImage: {
    width: 220,
    height: 220,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});
