import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import API from '../services/api';
import PillSelector from '../components/PillSelector';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function AddHabitScreen({ goBack }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleAddHabit = async () => {
    if (!name || !cost || !time) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (isNaN(Number(cost)) || isNaN(Number(time))) {
      Alert.alert('Invalid input', 'Cost and time must be numbers.');
      return;
    }
    try {
      setLoading(true);
      await API.post('/habits/add', {
        name,
        costPerUse: Number(cost),
        frequencyType: frequency,
        frequencyValue: 1,
        timePerUse: Number(time),
      });
      goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to add habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={goBack} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>New Habit</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Illustration */}
          <View style={styles.illustrationWrap}>
            <Text style={styles.illustrationEmoji}>🗓️</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Habit Name */}
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Daily Coffee"
              placeholderTextColor={colors.textMuted}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />

            {/* Cost & Time row */}
            <View style={styles.rowFields}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.label}>Cost per use (₹)</Text>
                <TextInput
                  style={[styles.input, focusedField === 'cost' && styles.inputFocused]}
                  value={cost}
                  onChangeText={setCost}
                  placeholder="200"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('cost')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time per use (min)</Text>
                <TextInput
                  style={[styles.input, focusedField === 'time' && styles.inputFocused]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="15"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('time')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Frequency */}
            <Text style={styles.label}>Repeat</Text>
            <PillSelector
              options={FREQUENCY_OPTIONS}
              selected={frequency}
              onSelect={setFrequency}
            />

            {/* Preview pill */}
            {name || cost ? (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>Estimated yearly impact</Text>
                <Text style={styles.previewCost}>
                  ₹{
                    frequency === 'daily'
                      ? Math.round(Number(cost || 0) * 365).toLocaleString('en-IN')
                      : frequency === 'weekly'
                      ? Math.round(Number(cost || 0) * 52).toLocaleString('en-IN')
                      : Math.round(Number(cost || 0) * 12).toLocaleString('en-IN')
                  }/yr
                </Text>
                <Text style={styles.previewSub}>
                  ≈ ₹{
                    frequency === 'daily'
                      ? Math.round(Number(cost || 0) * 30).toLocaleString('en-IN')
                      : frequency === 'weekly'
                      ? Math.round(Number(cost || 0) * 4).toLocaleString('en-IN')
                      : Math.round(Number(cost || 0) * 1).toLocaleString('en-IN')
                  }/mo
                </Text>
              </View>
            ) : null}

          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleAddHabit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Habit 💰'}</Text>
          </TouchableOpacity>

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
    paddingBottom: spacing.xl,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  screenTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },

  // Illustration
  illustrationWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  illustrationEmoji: {
    fontSize: 72,
  },

  // Form
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
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
    marginBottom: spacing.xs,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  rowFields: {
    flexDirection: 'row',
  },

  // Preview card
  previewCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#FFD9BB',
    alignItems: 'center',
  },
  previewLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewCost: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  previewSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // CTA
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadow.medium,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});