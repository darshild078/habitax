import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function SplashLoader() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[{ transform: [{ scale: pulse }] }]}>
        <Image source={require('../../assets/habitax_logo.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Text style={styles.name}>HabiTax</Text>
      <Text style={styles.sub}>Know what your habits truly cost you.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 16,
  },
  name: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
