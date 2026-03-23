import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { useState } from 'react';
import API from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

export default function RegisterScreen({ goToHome, goToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleRegister = async () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!email.includes('@')) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setApiError('');
    try {
      setLoading(true);
      await API.post('/auth/register', { name, email, password });
      const res = await API.post('/auth/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      goToHome();
    } catch (err) {
      const isOffline = !err.response;
      setApiError(isOffline ? 'No internet connection. Check your network.' : err.response?.data?.msg || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={styles.hero}>
            <Image source={require('../../assets/habitax_logo.png')} style={styles.appLogo} resizeMode="contain" />
            <Text style={styles.appName}>HabiTax</Text>
            <Text style={styles.tagline}>Ready to face the truth? Let's start.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSubtitle}>It's free, no credit card needed.</Text>

            {/* Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, focusedField === 'name' && styles.inputFocused, errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors(e => ({...e, name: ''})); }}
              placeholder="Darsh Shah"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused, errors.email && styles.inputError]}
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors(e => ({...e, email: ''})); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused, errors.password && styles.inputError]}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors(e => ({...e, password: ''})); }}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

            {apiError ? (
              <View style={styles.apiBanner}>
                <Text style={styles.apiBannerText}>{apiError}</Text>
              </View>
            ) : null}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={goToLogin}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl + 8,
    marginTop: spacing.xl,
  },
  appLogo: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg + 4,
    ...shadow.medium,
  },
  cardTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.xs,
    marginTop: -spacing.xs,
  },
  apiBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  apiBannerText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadow.soft,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
