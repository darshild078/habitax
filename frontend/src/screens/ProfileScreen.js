import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Animated, RefreshControl, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

// ── Helpers ───────────────────────────────────────────────────

function getAvatarColor(name) {
  const palette = ['#F97316','#EF4444','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EC4899','#6366F1'];
  if (!name) return palette[0];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}

// ── Stat Tile ─────────────────────────────────────────────────

function StatTile({ label, value, icon }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── XP Bar ────────────────────────────────────────────────────

function XPBar({ currentXP, nextLevelXP, progress }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [progress]);
  const width = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.xpSection}>
      <View style={styles.xpTrack}>
        <Animated.View style={[styles.xpFill, { width }]} />
      </View>
      <View style={styles.xpLabels}>
        <Text style={styles.xpText}>{currentXP} XP</Text>
        {nextLevelXP && <Text style={styles.xpText}>{nextLevelXP} XP</Text>}
      </View>
    </View>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────

function EditProfileModal({ visible, onClose, profile, onSaved }) {
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setCurrentPw('');
      setNewPw('');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!name || !email) { Alert.alert('Required', 'Name and email cannot be empty.'); return; }
    if (newPw && !currentPw) { Alert.alert('Required', 'Enter current password to set a new one.'); return; }
    if (newPw && newPw.length < 6) { Alert.alert('Too short', 'Password must be at least 6 characters.'); return; }

    try {
      setSaving(true);
      const payload = { name, email };
      if (newPw) { payload.currentPassword = currentPw; payload.newPassword = newPw; }
      await API.put('/auth/profile', payload);
      Alert.alert('Saved!', 'Profile updated successfully.');
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.msg || 'Could not update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.editOverlay}>
        <View style={styles.editSheet}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}
              placeholder="Your name" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="your@email.com" placeholderTextColor={colors.textMuted}
              keyboardType="email-address" autoCapitalize="none" />

            <View style={styles.editDivider}>
              <View style={styles.editDivLine} />
              <Text style={styles.editDivText}>Change Password (optional)</Text>
              <View style={styles.editDivLine} />
            </View>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput style={styles.input} value={currentPw} onChangeText={setCurrentPw}
              placeholder="Leave blank to keep" placeholderTextColor={colors.textMuted} secureTextEntry />

            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput style={styles.input} value={newPw} onChangeText={setNewPw}
              placeholder="Min. 6 characters" placeholderTextColor={colors.textMuted} secureTextEntry />
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave} disabled={saving} activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Delete Account Modal ──────────────────────────────────────

function DeleteAccountModal({ visible, onClose, onDeleted }) {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (visible) setPassword(''); }, [visible]);

  const handleDelete = async () => {
    if (!password) { Alert.alert('Required', 'Enter your password to confirm.'); return; }

    Alert.alert(
      'Are you absolutely sure?',
      'This will permanently delete your account, all habits, plants, achievements, and orbs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await API.delete('/auth/account', { data: { password } });
              Alert.alert('Account deleted', 'Your data has been removed.');
              onDeleted();
            } catch (err) {
              Alert.alert('Failed', err.response?.data?.msg || 'Could not delete account.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.editOverlay}>
        <View style={styles.deleteSheet}>
          <Ionicons name="warning" size={36} color="#EF4444" style={{ marginBottom: spacing.md }} />
          <Text style={styles.deleteTitle}>Delete Account</Text>
          <Text style={styles.deleteSub}>
            Enter your password to permanently delete your account and ALL associated data.
          </Text>

          <TextInput
            style={[styles.input, { borderColor: '#FECACA' }]}
            value={password} onChangeText={setPassword}
            placeholder="Your password" placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
            onPress={handleDelete} disabled={deleting} activeOpacity={0.85}
          >
            <Text style={styles.deleteBtnText}>{deleting ? 'Deleting...' : 'Permanently Delete Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteCancelBtn} onPress={onClose}>
            <Text style={styles.deleteCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── ProfileScreen ─────────────────────────────────────────────

export default function ProfileScreen({ goBack, goToLogin }) {
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/auth/profile');
      setProfile(res.data);
    } catch (err) {
      console.log('Profile load:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleAccountDeleted = async () => {
    await AsyncStorage.removeItem('token');
    if (goToLogin) goToLogin();
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>{'   '}</Text>
          <Text style={styles.loadText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { level, disciplineType, stats, streakLoss, achievements } = profile;
  const avatarColor = getAvatarColor(profile.name);

  const ALL_KEYS = [
    'streak_7','streak_14','streak_30','streak_100',
    'first_tree','trees_5', 'orbs_50','orbs_200', 'plants_10'
  ];
  const LABELS = {
    streak_7: 'Week Warrior', streak_14: 'Two Week Titan', streak_30: 'Monthly Master',
    streak_100: 'Centurion', first_tree: 'First Forest', trees_5: 'Forest Guardian',
    orbs_50: 'Orb Collector', orbs_200: 'Orb Master', plants_10: 'Garden Architect',
  };
  const DESCS = {
    streak_7: '7-day streak', streak_14: '14-day streak', streak_30: '30-day streak',
    streak_100: '100-day streak', first_tree: 'First max tree', trees_5: '5 max trees',
    orbs_50: '50 orbs earned', orbs_200: '200 orbs earned', plants_10: '10 seeds planted',
  };
  const unlockedSet = new Set(achievements.map(a => a.key));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          {/* Edit button */}
          <TouchableOpacity style={styles.editIconBtn} onPress={() => setShowEdit(true)}>
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>

          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
          </View>
          <Text style={styles.heroName}>{profile.name}</Text>
          <Text style={styles.heroEmail}>{profile.email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{level.number} {level.title}</Text>
            </View>
            <View style={styles.disciplineBadge}>
              <Text style={styles.disciplineText}>{disciplineType}</Text>
            </View>
          </View>

          <XPBar currentXP={level.currentXP} nextLevelXP={level.nextLevelXP} progress={level.progress} />
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsGrid}>
          <StatTile icon="⚡" label="Orbs" value={profile.energyOrbs} />
          <StatTile icon="🔥" label="Best Streak" value={`${stats.bestLongestStreak}d`} />
          <StatTile icon="🌳" label="Trees" value={stats.totalTrees} />
          <StatTile icon="🌱" label="Plants" value={stats.totalPlants} />
        </View>

        {/* ── Weekly Stats ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyRow}>
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{stats.weeklyHabitsCompleted}</Text>
              <Text style={styles.weeklyLabel}>habits done</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{stats.weeklyOrbsEarned}</Text>
              <Text style={styles.weeklyLabel}>orbs earned</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyItem}>
              <Text style={styles.weeklyValue}>{stats.bestCurrentStreak}d</Text>
              <Text style={styles.weeklyLabel}>active streak</Text>
            </View>
          </View>
        </View>

        {/* ── Streak Loss ── */}
        {streakLoss && (
          <View style={styles.lossCard}>
            <View style={styles.lossIcon}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            </View>
            <View style={styles.lossContent}>
              <Text style={styles.lossTitle}>Streak Lost</Text>
              <Text style={styles.lossDetail}>
                "{streakLoss.habitName}" — {timeAgo(streakLoss.date)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Achievements ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionCount}>{achievements.length}/{ALL_KEYS.length}</Text>
          </View>
          <View style={styles.achieveGrid}>
            {ALL_KEYS.map(key => {
              const unlocked = unlockedSet.has(key);
              return (
                <View key={key} style={[styles.achieveTile, !unlocked && styles.achieveTileLocked]}>
                  <View style={[styles.achieveIcon, unlocked ? styles.achieveIconUnlocked : styles.achieveIconLocked]}>
                    <Ionicons name={unlocked ? 'trophy' : 'lock-closed'} size={20}
                      color={unlocked ? '#F57F17' : colors.textMuted} />
                  </View>
                  <Text style={[styles.achieveLabel, !unlocked && styles.achieveLabelLocked]} numberOfLines={2}>
                    {LABELS[key]}
                  </Text>
                  <Text style={styles.achieveDesc} numberOfLines={1}>{DESCS[key]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Account Section ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.accountActionRow} onPress={() => setShowEdit(true)}>
            <View style={styles.accountActionIcon}>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.accountActionLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.accountRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.accountText}>
              Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <View style={styles.accountDivider} />

          <TouchableOpacity style={styles.deleteRow} onPress={() => setShowDelete(true)}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.deleteRowText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        profile={profile}
        onSaved={load}
      />
      <DeleteAccountModal
        visible={showDelete}
        onClose={() => setShowDelete(false)}
        onDeleted={handleAccountDeleted}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { ...typography.body, color: colors.textSecondary },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },

  // Hero
  heroCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.md, ...shadow.soft,
  },
  editIconBtn: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, ...shadow.medium,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  heroName: { ...typography.title, color: colors.textPrimary, marginBottom: 2 },
  heroEmail: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },

  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  levelBadge: {
    backgroundColor: '#FFFDE7', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#FFE082',
  },
  levelText: { ...typography.caption, color: '#F57F17', fontWeight: '700' },
  disciplineBadge: {
    backgroundColor: colors.accentGreenLight, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4,
  },
  disciplineText: { ...typography.caption, color: colors.accentGreen, fontWeight: '700' },

  // XP
  xpSection: { width: '100%' },
  xpTrack: { height: 8, backgroundColor: colors.divider, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  xpFill: { height: '100%', backgroundColor: '#F57F17', borderRadius: 4 },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  xpText: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statTile: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'center', ...shadow.soft,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { ...typography.heading, color: colors.textPrimary, fontSize: 18, lineHeight: 22 },
  statLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 10, marginTop: 2 },

  // Section card
  sectionCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, ...shadow.soft,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  sectionCount: { ...typography.caption, color: colors.textMuted },

  // Weekly
  weeklyRow: { flexDirection: 'row', alignItems: 'center' },
  weeklyItem: { flex: 1, alignItems: 'center' },
  weeklyValue: { ...typography.heading, color: colors.primary, fontSize: 22, lineHeight: 26 },
  weeklyLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  weeklyDivider: { width: 1, height: 36, backgroundColor: colors.divider },

  // Streak loss
  lossCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#FECACA',
  },
  lossIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  lossContent: { flex: 1 },
  lossTitle: { ...typography.label, color: '#DC2626', marginBottom: 2 },
  lossDetail: { ...typography.caption, color: '#7F1D1D', lineHeight: 16 },

  // Achievements
  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achieveTile: { width: '30%', alignItems: 'center', paddingVertical: spacing.sm },
  achieveTileLocked: { opacity: 0.35 },
  achieveIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  achieveIconUnlocked: { backgroundColor: '#FFFDE7', borderWidth: 1, borderColor: '#FFE082' },
  achieveIconLocked: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  achieveLabel: { ...typography.caption, color: colors.textPrimary, textAlign: 'center', fontWeight: '600', fontSize: 10 },
  achieveLabelLocked: { color: colors.textMuted },
  achieveDesc: { ...typography.caption, color: colors.textMuted, fontSize: 8, textAlign: 'center', marginTop: 1 },

  // Account section
  accountActionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  accountActionIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  accountActionLabel: { ...typography.subheading, color: colors.textPrimary, flex: 1, fontSize: 14 },
  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm,
  },
  accountText: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  accountDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm,
  },
  deleteRowText: { ...typography.label, color: '#EF4444', fontSize: 13 },

  // Edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  editSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 36, maxHeight: '80%',
  },
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg,
  },
  editTitle: { ...typography.heading, color: colors.textPrimary },
  editDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, gap: spacing.sm },
  editDivLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  editDivText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  fieldLabel: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2,
    ...typography.body, color: colors.textPrimary,
    borderWidth: 1.5, borderColor: colors.border, marginBottom: spacing.xs,
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing.md + 2, marginTop: spacing.md, ...shadow.medium,
  },
  saveBtnText: { ...typography.button, color: '#FFF' },

  // Delete modal
  deleteSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 36, alignItems: 'center',
  },
  deleteTitle: { ...typography.heading, color: '#DC2626', marginBottom: spacing.sm },
  deleteSub: {
    ...typography.body, color: colors.textSecondary, textAlign: 'center',
    marginBottom: spacing.lg, lineHeight: 22,
  },
  deleteBtn: {
    backgroundColor: '#EF4444', borderRadius: radius.pill, paddingVertical: spacing.md + 2,
    width: '100%', alignItems: 'center', marginTop: spacing.md,
  },
  deleteBtnText: { ...typography.button, color: '#FFF' },
  deleteCancelBtn: { marginTop: spacing.md, paddingVertical: spacing.md },
  deleteCancelText: { ...typography.label, color: colors.textSecondary },
});
