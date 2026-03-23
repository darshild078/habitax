import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

export default function EditHabitScreen({ habit, goBack }) {
  const [name, setName] = useState(habit.name || '');
  const [cost, setCost] = useState(String(habit.costPerUse || ''));
  const [time, setTime] = useState(String(habit.timePerUse || ''));
  const [frequency, setFrequency] = useState(habit.frequencyType || 'daily');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSave = async () => {
    if (!name || !cost || !time) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      await API.put(`/habits/update/${habit._id}`, {
        name,
        costPerUse: Number(cost),
        frequencyType: frequency,
        frequencyValue: 1,
        timePerUse: Number(time),
      });
      goBack(true); // true = refresh needed
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to update habit');
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
            <TouchableOpacity onPress={() => goBack(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Edit the Damage ✏️</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.illustrationWrap}>
            <Image source={require('../../assets/edit_habit_art.png')} style={styles.illustration} resizeMode="contain" />
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Habit Name */}
            <Text style={styles.label}>What drains you?</Text>
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
                <Text style={styles.label}>Cost per hit (₹)</Text>
                <TextInput
                  style={[styles.input, focusedField === 'cost' && styles.inputFocused]}
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('cost')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time wasted (min)</Text>
                <TextInput
                  style={[styles.input, focusedField === 'time' && styles.inputFocused]}
                  value={time}
                  onChangeText={setTime}
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

            {/* Live cost preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Revised annual damage</Text>
              <Text style={styles.previewCost}>
                ₹{
                  frequency === 'daily'
                    ? Math.round(Number(cost || 0) * 365).toLocaleString('en-IN')
                    : frequency === 'weekly'
                    ? Math.round(Number(cost || 0) * 52).toLocaleString('en-IN')
                    : Math.round(Number(cost || 0) * 12).toLocaleString('en-IN')
                }/yr
              </Text>
            </View>

          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.textOnPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>{loading ? 'Updating...' : 'Update the Tax 📝'}</Text>
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
  screenTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  illustrationWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  illustration: {
    width: 160,
    height: 160,
  },
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
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
