import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, RefreshControl, Alert, Modal, FlatList, Share
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import API from '../services/api';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

// ── Sub-section pills ─────────────────────────────────────────

const SECTIONS = [
  { key: 'leaderboard', label: 'Ranks' },
  { key: 'groups',      label: 'Groups' },
  { key: 'friends',     label: 'Friends' },
  { key: 'feed',        label: 'Feed' },
];

// ── Helpers ───────────────────────────────────────────────────

function getAvatarColor(name) {
  const palette = ['#F97316','#EF4444','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EC4899','#6366F1'];
  if (!name) return palette[0];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name[0].toUpperCase();
}

function timeAgo(date) {
  if (!date) return '';
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (d < 1) return 'just now';
  if (d < 60) return `${d}m ago`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function activityText(item) {
  const n = item.userName;
  switch (item.type) {
    case 'habit_done':
      if (item.data?.nudge) return `${item.data.from} nudged you for "${item.data.groupName}"`;
      return `${n} completed "${item.data?.habitName || 'a habit'}"`;
    case 'streak_milestone':
      return `${n} hit a ${item.data?.streak}-day streak!`;
    case 'plant_evolved':
      return `${n} evolved a plant to ${item.data?.stage}!`;
    case 'group_penalty':
      return item.data?.reason === 'you_missed'
        ? `${n} missed "${item.data?.groupName}" — lost ${Math.abs(item.data?.orbs)} orbs`
        : `${n}'s teammate missed "${item.data?.groupName}" — lost ${Math.abs(item.data?.orbs)} orbs`;
    case 'achievement_unlocked':
      return `${n} unlocked "${item.data?.label}"!`;
    case 'friend_added':
      return `${n} added a new friend`;
    case 'group_joined':
      return `${n} joined "${item.data?.groupName}"`;
    case 'group_completed':
      return `Everyone completed "${item.data?.groupName}"!`;
    default:
      return `${n} did something`;
  }
}

// ── MiniAvatar ────────────────────────────────────────────────

function MiniAvatar({ name, size = 36 }) {
  return (
    <View style={[s.miniAvatar, { width: size, height: size, borderRadius: size / 3, backgroundColor: getAvatarColor(name) }]}>
      <Text style={[s.miniAvatarText, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
    </View>
  );
}

// ── Leaderboard Section ───────────────────────────────────────

function LeaderboardSection({ data, loading }) {
  if (loading) return <Text style={s.emptyText}>Loading rankings...</Text>;
  if (!data || data.length === 0) return <Text style={s.emptyText}>Add friends to see the leaderboard</Text>;

  return (
    <View>
      {data.map((entry, idx) => (
        <View key={entry._id || idx} style={[s.leaderRow, entry.isYou && s.leaderRowYou]}>
          <Text style={[s.rank, idx < 3 && s.rankTop]}>{entry.rank}</Text>
          <MiniAvatar name={entry.name} />
          <View style={s.leaderInfo}>
            <Text style={s.leaderName} numberOfLines={1}>
              {entry.name} {entry.isYou ? '(You)' : ''}
            </Text>
            <Text style={s.leaderSub}>{entry.weeklyOrbs} orbs this week</Text>
          </View>
          <View style={s.leaderStats}>
            <Text style={s.leaderStreak}>{entry.bestStreak}d</Text>
            <Text style={s.leaderStatsLabel}>streak</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Groups Section ────────────────────────────────────────────

function GroupsSection({ groups, invites, onMark, onAccept, onDecline, onNudge, onCreate, loading }) {
  if (loading) return <Text style={s.emptyText}>Loading groups...</Text>;

  return (
    <View>
      {/* Invites */}
      {invites && invites.length > 0 && (
        <View style={s.inviteCard}>
          <Text style={s.inviteTitle}>Pending Invites</Text>
          {invites.map(inv => (
            <View key={inv._id} style={s.inviteRow}>
              <Text style={s.inviteText} numberOfLines={1}>
                {inv.createdBy} invited you to "{inv.name}"
              </Text>
              <View style={s.inviteBtns}>
                <TouchableOpacity style={s.acceptBtn} onPress={() => onAccept(inv._id)}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={s.declineBtn} onPress={() => onDecline(inv._id)}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Group cards */}
      {groups && groups.length > 0 ? (
        groups.map(g => (
          <View key={g._id} style={s.groupCard}>
            <View style={s.groupHeader}>
              <Text style={s.groupName}>{g.name}</Text>
              <Text style={s.groupStreak}>{g.groupStreak}d streak</Text>
            </View>

            {/* Members status */}
            {g.todayStatus?.map(m => (
              <View key={m._id} style={s.memberRow}>
                <MiniAvatar name={m.name} size={28} />
                <Text style={s.memberName} numberOfLines={1}>{m.name}</Text>
                {m.done ? (
                  <View style={s.statusDone}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  </View>
                ) : (
                  <View style={s.statusPending}>
                    <Ionicons name="time-outline" size={18} color="#F59E0B" />
                  </View>
                )}
                {!m.done && (
                  <TouchableOpacity style={s.nudgeBtn} onPress={() => onNudge(g._id, m._id)}>
                    <Text style={s.nudgeBtnText}>Nudge</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Warning + mark */}
            <View style={s.groupWarning}>
              <Ionicons name="warning-outline" size={14} color="#F59E0B" />
              <Text style={s.groupWarningText}>If anyone misses, everyone loses orbs</Text>
            </View>

            <TouchableOpacity style={s.markGroupBtn} onPress={() => onMark(g._id)} activeOpacity={0.8}>
              <Ionicons name="checkmark-done" size={16} color="#FFF" />
              <Text style={s.markGroupBtnText}>Mark Done</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>No group habits yet</Text>
        </View>
      )}

      <TouchableOpacity style={s.createBtn} onPress={onCreate} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={18} color="#FFF" />
        <Text style={s.createBtnText}>Create Group Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Friends Section ───────────────────────────────────────────

function FriendsSection({ friends, requests, myLink, onAccept, onReject, onAdd, loading }) {
  const handleCopyLink = async () => {
    if (myLink) {
      await Clipboard.setString(myLink);
      Alert.alert('Copied!', 'Friend link copied to clipboard');
    }
  };

  const handleShareLink = async () => {
    if (myLink) {
      try {
        await Share.share({
          message: `Let's be friends on Habitax! 🌟\n\n${myLink}\n\nClick this link and we'll instantly be friends!`,
          title: 'Add me on Habitax',
        });
      } catch (err) {
        Alert.alert('Error', 'Could not share link');
      }
    }
  };

  if (loading) return <Text style={s.emptyText}>Loading friends...</Text>;

  return (
    <View>
      {/* Your Friend Link Card */}
      {myLink && (
        <View style={s.myLinkCard}>
          <View style={s.myLinkHeader}>
            <View>
              <Text style={s.myLinkTitle}>Your Friend Link</Text>
              <Text style={s.myLinkSub}>Share to instantly become friends</Text>
            </View>
            <Ionicons name="share-social" size={24} color={colors.primary} />
          </View>

          <View style={s.linkBox}>
            <Text style={s.linkValue} numberOfLines={2}>{myLink}</Text>
            <TouchableOpacity style={s.copyBtn} onPress={handleCopyLink}>
              <Ionicons name="copy" size={16} color={colors.primary} />
              <Text style={s.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.shareBtn} onPress={handleShareLink} activeOpacity={0.85}>
            <Ionicons name="share-social" size={16} color="#FFF" />
            <Text style={s.shareBtnText}>Share Link</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Requests */}
      {requests && requests.length > 0 && (
        <View style={s.inviteCard}>
          <Text style={s.inviteTitle}>Friend Requests</Text>
          {requests.map(r => (
            <View key={r._id} style={s.inviteRow}>
              <MiniAvatar name={r.requester?.name} size={28} />
              <Text style={s.inviteText} numberOfLines={1}>{r.requester?.name} ({r.requester?.email})</Text>
              <View style={s.inviteBtns}>
                <TouchableOpacity style={s.acceptBtn} onPress={() => onAccept(r._id)}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={s.declineBtn} onPress={() => onReject(r._id)}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Friend list */}
      {friends && friends.length > 0 ? (
        friends.map(f => (
          <View key={f._id} style={s.friendRow}>
            <MiniAvatar name={f.name} />
            <View style={s.friendInfo}>
              <Text style={s.friendName}>{f.name}</Text>
              <Text style={s.friendEmail}>{f.email}</Text>
            </View>
            <Text style={s.friendOrbs}>{f.energyOrbs} orbs</Text>
          </View>
        ))
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>No friends yet</Text>
        </View>
      )}

      <TouchableOpacity style={s.createBtn} onPress={onAdd} activeOpacity={0.85}>
        <Ionicons name="person-add-outline" size={18} color="#FFF" />
        <Text style={s.createBtnText}>Add Friend by Email</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Feed Section ──────────────────────────────────────────────

function FeedSection({ feed, loading }) {
  if (loading) return <Text style={s.emptyText}>Loading feed...</Text>;
  if (!feed || feed.length === 0) return <Text style={s.emptyText}>No recent activity</Text>;

  return (
    <View>
      {feed.map(item => (
        <View key={item._id} style={s.feedItem}>
          <MiniAvatar name={item.userName} size={32} />
          <View style={s.feedContent}>
            <Text style={s.feedText}>{activityText(item)}</Text>
            <Text style={s.feedTime}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Create Group Modal ────────────────────────────────────────

function CreateGroupModal({ visible, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Group name is needed'); return; }
    try {
      setCreating(true);
      const inviteEmails = emails.split(',').map(e => e.trim()).filter(Boolean);
      await API.post('/groups/create', { name: name.trim(), inviteEmails });
      Alert.alert('Created!', `Group "${name}" created.`);
      setName(''); setEmails('');
      onCreated();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Create Group Habit</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={s.fieldLabel}>Group Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="e.g. Morning Run" placeholderTextColor={colors.textMuted} />

          <Text style={s.fieldLabel}>Invite Friends (emails, comma-separated)</Text>
          <TextInput style={s.input} value={emails} onChangeText={setEmails}
            placeholder="friend@email.com, other@email.com"
            placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="email-address" />

          <TouchableOpacity style={[s.createBtn, creating && { opacity: 0.6 }]}
            onPress={handleCreate} disabled={creating} activeOpacity={0.85}>
            <Text style={s.createBtnText}>{creating ? 'Creating...' : 'Create Group'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main SocialScreen ─────────────────────────────────────────

export default function SocialScreen() {
  const [section, setSection] = useState('leaderboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [groups, setGroups]           = useState([]);
  const [groupInvites, setGroupInvites] = useState([]);
  const [friends, setFriends]         = useState([]);
  const [requests, setRequests]       = useState([]);
  const [feed, setFeed]               = useState([]);
  const [myLink, setMyLink]           = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const load = useCallback(async () => {
    try {
      const [lb, gr, fr, rq, fd, link] = await Promise.all([
        API.get('/social/leaderboard').catch(() => ({ data: [] })),
        API.get('/groups').catch(() => ({ data: { groups: [], invites: [] } })),
        API.get('/friends/list').catch(() => ({ data: [] })),
        API.get('/friends/requests').catch(() => ({ data: [] })),
        API.get('/social/feed').catch(() => ({ data: [] })),
        API.get('/friends/link').catch(() => ({ data: { link: null } })),
      ]);
      setLeaderboard(lb.data);
      setGroups(gr.data.groups || []);
      setGroupInvites(gr.data.invites || []);
      setFriends(fr.data);
      setRequests(rq.data);
      setFeed(fd.data);
      setMyLink(link.data.link);
    } catch (e) {
      console.log('Social load:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  // ── Actions ──
  const handleMarkGroup = async (groupId) => {
    try {
      const res = await API.post(`/groups/mark/${groupId}`);
      Alert.alert('Done!', res.data.allMembersComplete
        ? 'Everyone completed! Great teamwork!'
        : `${res.data.completedCount}/${res.data.totalMembers} done so far`);
      load();
    } catch (err) {
      Alert.alert('Oops', err.response?.data?.msg || 'Failed');
    }
  };

  const handleGroupAccept = async (groupId) => {
    try {
      await API.put('/groups/respond-invite', { groupId, action: 'accepted' });
      load();
    } catch (err) { Alert.alert('Error', err.response?.data?.msg || 'Failed'); }
  };

  const handleGroupDecline = async (groupId) => {
    try {
      await API.put('/groups/respond-invite', { groupId, action: 'declined' });
      load();
    } catch (err) { Alert.alert('Error', err.response?.data?.msg || 'Failed'); }
  };

  const handleNudge = async (groupHabitId, userId) => {
    try {
      await API.post('/groups/nudge', { groupHabitId, userId });
      Alert.alert('Nudged!', 'They will get a reminder.');
    } catch (err) { Alert.alert('Error', err.response?.data?.msg || 'Failed'); }
  };

  const handleAddFriend = () => {
    Alert.prompt('Add Friend', 'Enter their email address:', async (email) => {
      if (!email) return;
      try {
        const res = await API.post('/friends/request', { email: email.trim() });
        Alert.alert('Sent!', res.data.msg);
        load();
      } catch (err) {
        Alert.alert('Error', err.response?.data?.msg || 'Failed');
      }
    });
  };

  const handleAddFriendFallback = () => {
    // For Android (no Alert.prompt), use a simple approach
    const email = global._tempFriendEmail;
    Alert.alert('Add Friend', 'Enter the email in the prompt below.');
    // In production, would use a modal. For now, simple alert.
    handleAddFriendModal();
  };

  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const handleAddFriendModal = () => setShowFriendModal(true);

  const submitFriendRequest = async () => {
    if (!friendEmail.trim()) return;
    try {
      const res = await API.post('/friends/request', { email: friendEmail.trim() });
      Alert.alert('Sent!', res.data.msg);
      setFriendEmail('');
      setShowFriendModal(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed');
    }
  };

  const handleAcceptFriend = async (friendshipId) => {
    try {
      await API.put('/friends/respond', { friendshipId, action: 'accepted' });
      load();
    } catch (err) { Alert.alert('Error', err.response?.data?.msg || 'Failed'); }
  };

  const handleRejectFriend = async (friendshipId) => {
    try {
      await API.put('/friends/respond', { friendshipId, action: 'rejected' });
      load();
    } catch (err) { Alert.alert('Error', err.response?.data?.msg || 'Failed'); }
  };

  const pendingCount = (requests?.length || 0) + (groupInvites?.length || 0);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Social</Text>
        {pendingCount > 0 && (
          <View style={s.badge}><Text style={s.badgeText}>{pendingCount}</Text></View>
        )}
      </View>

      {/* Section pills */}
      <View style={s.pillRow}>
        {SECTIONS.map(sec => (
          <TouchableOpacity
            key={sec.key}
            style={[s.pill, section === sec.key && s.pillActive]}
            onPress={() => setSection(sec.key)}
          >
            <Text style={[s.pillText, section === sec.key && s.pillTextActive]}>{sec.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {section === 'leaderboard' && <LeaderboardSection data={leaderboard} loading={loading} />}
        {section === 'groups' && (
          <GroupsSection groups={groups} invites={groupInvites}
            onMark={handleMarkGroup} onAccept={handleGroupAccept}
            onDecline={handleGroupDecline} onNudge={handleNudge}
            onCreate={() => setShowCreateGroup(true)} loading={loading} />
        )}
        {section === 'friends' && (
          <FriendsSection friends={friends} requests={requests} myLink={myLink}
            onAccept={handleAcceptFriend} onReject={handleRejectFriend}
            onAdd={handleAddFriendModal} loading={loading} />
        )}
        {section === 'feed' && <FeedSection feed={feed} loading={loading} />}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={load}
      />

      {/* Add Friend Modal */}
      <Modal visible={showFriendModal} transparent animationType="slide" onRequestClose={() => setShowFriendModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setShowFriendModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Friend's Email</Text>
            <TextInput style={s.input} value={friendEmail} onChangeText={setFriendEmail}
              placeholder="friend@email.com" placeholderTextColor={colors.textMuted}
              autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity style={s.createBtn} onPress={submitFriendRequest} activeOpacity={0.85}>
              <Ionicons name="paper-plane-outline" size={16} color="#FFF" />
              <Text style={s.createBtnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  headerTitle: { ...typography.title, color: colors.textPrimary },
  badge: {
    backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Pills
  pillRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.surface, ...shadow.soft,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#FFF' },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  // MiniAvatar
  miniAvatar: { alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontWeight: '800', color: '#FFF' },

  // Leaderboard
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadow.soft,
  },
  leaderRowYou: { borderWidth: 1.5, borderColor: colors.primary },
  rank: { ...typography.heading, color: colors.textMuted, width: 28, textAlign: 'center', fontSize: 16 },
  rankTop: { color: '#F57F17' },
  leaderInfo: { flex: 1 },
  leaderName: { ...typography.label, color: colors.textPrimary },
  leaderSub: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  leaderStats: { alignItems: 'center' },
  leaderStreak: { ...typography.heading, color: colors.primary, fontSize: 16 },
  leaderStatsLabel: { ...typography.caption, color: colors.textMuted, fontSize: 8 },

  // Groups
  groupCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, ...shadow.soft,
  },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
  },
  groupName: { ...typography.subheading, color: colors.textPrimary },
  groupStreak: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  memberName: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 13 },
  statusDone: { marginRight: spacing.xs },
  statusPending: { marginRight: spacing.xs },
  nudgeBtn: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill,
    backgroundColor: '#FFFDE7', borderWidth: 1, borderColor: '#FFE082',
  },
  nudgeBtnText: { ...typography.caption, color: '#F57F17', fontWeight: '700', fontSize: 10 },
  groupWarning: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#FFFDE7', borderRadius: radius.sm, padding: spacing.sm,
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },
  groupWarningText: { ...typography.caption, color: '#92400E', fontSize: 10, flex: 1 },
  markGroupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#10B981', borderRadius: radius.pill, paddingVertical: spacing.sm + 2,
  },
  markGroupBtnText: { ...typography.button, color: '#FFF', fontSize: 13 },

  // Invites
  inviteCard: {
    backgroundColor: '#FFFDE7', borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#FFE082',
  },
  inviteTitle: { ...typography.label, color: '#F57F17', marginBottom: spacing.sm },
  inviteRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs,
  },
  inviteText: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 12 },
  inviteBtns: { flexDirection: 'row', gap: spacing.xs },
  acceptBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
  },
  declineBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },

  // Friends
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadow.soft,
  },
  friendInfo: { flex: 1 },
  friendName: { ...typography.label, color: colors.textPrimary },
  friendEmail: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  friendOrbs: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  // Feed
  feedItem: {
    flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  feedContent: { flex: 1 },
  feedText: { ...typography.body, color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  feedTime: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 2 },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  // Create button
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing.md, marginTop: spacing.md, ...shadow.medium,
  },
  createBtnText: { ...typography.button, color: '#FFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary },
  fieldLabel: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2,
    ...typography.body, color: colors.textPrimary,
    borderWidth: 1.5, borderColor: colors.border,
  },
});
