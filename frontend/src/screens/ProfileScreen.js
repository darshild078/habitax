import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

function getAvatarColor(name) {
  const palette = [
    '#F97316', '#EF4444', '#8B5CF6', '#3B82F6',
    '#10B981', '#F59E0B', '#EC4899', '#6366F1',
  ];
  if (!name) return palette[0];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

export default function ProfileScreen({ goBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Edit form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/auth/profile');
      setProfile(res.data);
      setName(res.data.name || '');
      setEmail(res.data.email || '');
    } catch (err) {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Reset password fields when entering edit mode
    setCurrentPassword('');
    setNewPassword('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset to original values
    setName(profile?.name || '');
    setEmail(profile?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Missing fields', 'Name and email cannot be empty.');
      return;
    }
    if (newPassword && !currentPassword) {
      Alert.alert('Required', 'Enter your current password to set a new one.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Too short', 'New password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await API.put('/auth/profile', payload);
      await fetchProfile();
      setCurrentPassword('');
      setNewPassword('');
      setIsEditing(false);
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.msg || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingEmoji}>👤</Text>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarColor = getAvatarColor(profile?.name);
  const initials = getInitials(profile?.name);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Your Profile</Text>
            {/* Edit toggle button */}
            {!isEditing ? (
              <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {!isEditing && (
              <>
                <Text style={styles.avatarName}>{profile?.name}</Text>
                <Text style={styles.avatarEmail}>{profile?.email}</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberText}>💸 HabiTax Member</Text>
                </View>
              </>
            )}
            {isEditing && (
              <Text style={styles.editingHint}>Update your details below</Text>
            )}
          </View>

          {/* VIEW MODE — Info rows */}
          {!isEditing && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{profile?.name}</Text>
                </View>
              </View>

              <View style={styles.infoRowDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{profile?.email}</Text>
                </View>
              </View>

              <View style={styles.infoRowDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Password</Text>
                  <Text style={styles.infoValue}>••••••••</Text>
                </View>
              </View>
            </View>
          )}

          {/* EDIT MODE — Single card with all fields */}
          {isEditing && (
            <View style={styles.editCard}>

              {/* Name */}
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />

              {/* Email */}
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />

              {/* Divider */}
              <View style={styles.sectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Change Password (optional)</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Current Password */}
              <Text style={styles.fieldLabel}>Current Password</Text>
              <TextInput
                style={[styles.input, focusedField === 'currentPw' && styles.inputFocused]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Leave blank to keep current"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                onFocus={() => setFocusedField('currentPw')}
                onBlur={() => setFocusedField(null)}
              />

              {/* New Password */}
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={[styles.input, focusedField === 'newPw' && styles.inputFocused]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                onFocus={() => setFocusedField('newPw')}
                onBlur={() => setFocusedField(null)}
              />

            </View>
          )}

          {/* Save button — only in edit mode */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.textOnPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          )}

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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 48, marginBottom: spacing.md },
  loadingText: { ...typography.body, color: colors.textSecondary },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  screenTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FFD9BB',
  },
  editBtnText: {
    ...typography.label,
    color: colors.primary,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    ...typography.label,
    color: colors.textSecondary,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.medium,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  avatarName: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  avatarEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  memberBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#FFD9BB',
  },
  memberText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  editingHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // View mode info card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 4,
  },

  // Edit mode — single card
  editCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  fieldLabel: {
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
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Save
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...shadow.medium,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});
