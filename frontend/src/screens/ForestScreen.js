import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Modal, Animated, Alert, Image, Dimensions, Vibration
} from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getPlants, addPlant, growPlant } from '../services/plantService';
import API from '../services/api';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing, { radius, shadow } from '../theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_COLS    = 4;
const GRID_ROWS    = 4;
const TOTAL_SLOTS  = GRID_COLS * GRID_ROWS; // 16 garden plots
const GRID_PAD     = spacing.md;
const SLOT_GAP     = 6;
const SLOT_SIZE    = (SCREEN_WIDTH - GRID_PAD * 2 - SLOT_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ── Image maps ────────────────────────────────────────────────

const PLANT_IMAGES = {
  focus_tree:      { seed: require('../../assets/plants/focus_tree_seed.png'),      bush: require('../../assets/plants/focus_tree_bush.png'),      tree: require('../../assets/plants/focus_tree_tree.png') },
  discipline_tree: { seed: require('../../assets/plants/discipline_tree_seed.png'), bush: require('../../assets/plants/discipline_tree_bush.png'), tree: require('../../assets/plants/discipline_tree_tree.png') },
  calm_tree:       { seed: require('../../assets/plants/calm_tree_seed.png'),       bush: require('../../assets/plants/calm_tree_bush.png'),       tree: require('../../assets/plants/calm_tree_tree.png') },
  gratitude_tree:  { seed: require('../../assets/plants/gratitude_tree_seed.png'),  bush: require('../../assets/plants/gratitude_tree_bush.png'),  tree: require('../../assets/plants/gratitude_tree_tree.png') },
};

const ORB_IMAGE    = require('../../assets/plants/energy_orb.png');
const SOIL_IMAGE   = require('../../assets/plants/garden_soil.png');
const GRASS_IMAGE  = require('../../assets/plants/garden_grass.png');

const PLANT_TYPES = {
  focus_tree:      { label: 'Focus Tree' },
  discipline_tree: { label: 'Discipline Tree' },
  calm_tree:       { label: 'Calm Tree' },
  gratitude_tree:  { label: 'Gratitude Tree' },
};

const STAGE_LABELS = { seed: 'Seed 🌱', bush: 'Bush 🌿', tree: 'Tree 🌳' };

// ── Plant Detail Modal (tap on a planted slot) ────────────────

function PlantDetailModal({ visible, onClose, plant, energyOrbs, onGrow }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !plant) return null;

  const typeInfo  = PLANT_TYPES[plant.type] || PLANT_TYPES.focus_tree;
  const imageSet  = PLANT_IMAGES[plant.type] || PLANT_IMAGES.focus_tree;
  const stageImg  = imageSet[plant.stage] || imageSet.seed;
  const orbsNeeded = plant.nextStageThreshold ?? 0;
  const progress   = plant.isMaxStage ? 1 : Math.min(plant.orbsInvested / orbsNeeded, 1);
  const orbsLeft   = plant.isMaxStage ? 0 : Math.max(0, orbsNeeded - plant.orbsInvested);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.detailCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity activeOpacity={1}>
            {/* Close button */}
            <TouchableOpacity style={styles.detailClose} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Plant image — large */}
            <View style={styles.detailImgWrap}>
              <Image source={stageImg} style={styles.detailImg} resizeMode="contain" />
            </View>

            {/* Name & stage */}
            <Text style={styles.detailName}>{typeInfo.label}</Text>
            <View style={styles.detailStageBadge}>
              <Text style={styles.detailStageText}>{STAGE_LABELS[plant.stage]}</Text>
            </View>

            {/* Progress */}
            {!plant.isMaxStage ? (
              <View style={styles.detailProgressSection}>
                <View style={styles.detailProgressTrack}>
                  <View style={[styles.detailProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
                <View style={styles.detailProgressLabels}>
                  <Text style={styles.detailProgressText}>{plant.orbsInvested} / {orbsNeeded} orbs invested</Text>
                  <Text style={styles.detailProgressNeed}>{orbsLeft} more to evolve</Text>
                </View>
              </View>
            ) : (
              <View style={styles.detailMaxRow}>
                <Text style={styles.detailMaxText}>✨ Fully grown — magnificent!</Text>
              </View>
            )}

            {/* Orb balance */}
            <View style={styles.detailOrbRow}>
              <Image source={ORB_IMAGE} style={styles.detailOrbIcon} />
              <Text style={styles.detailOrbText}>You have <Text style={styles.detailOrbBold}>{energyOrbs}</Text> orbs</Text>
            </View>

            {/* Grow button */}
            {!plant.isMaxStage && (
              <TouchableOpacity
                style={[styles.detailGrowBtn, energyOrbs < 1 && styles.detailGrowBtnDisabled]}
                onPress={() => onGrow(plant._id)}
                activeOpacity={0.75}
                disabled={energyOrbs < 1}
              >
                <Image source={ORB_IMAGE} style={styles.detailGrowOrbIcon} />
                <Text style={styles.detailGrowText}>
                  {energyOrbs < 1 ? 'Need more orbs' : 'Invest 1 Orb'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── CelebrationModal ──────────────────────────────────────────

function CelebrationModal({ visible, onClose, plantType, newStage }) {
  const typeInfo = PLANT_TYPES[plantType] || PLANT_TYPES.focus_tree;
  const imageSet = PLANT_IMAGES[plantType] || PLANT_IMAGES.focus_tree;
  const stageImg = imageSet[newStage] || imageSet.seed;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([0, 50, 100, 50]);
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0.5);
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.celebOverlay}>
        <Animated.View style={[styles.celebCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.celebSparkle}>✨🎉✨</Text>
          <Image source={stageImg} style={styles.celebImg} resizeMode="contain" />
          <Text style={styles.celebTitle}>
            {newStage === 'tree' ? '🌳 Fully Evolved!' : '🌿 Plant Upgraded!'}
          </Text>
          <Text style={styles.celebSub}>
            Your {typeInfo.label} grew into a {newStage === 'tree' ? 'Tree' : 'Bush'}!
          </Text>
          <TouchableOpacity style={styles.celebBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.celebBtnText}>Amazing! 🎊</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── AddPlantModal (pick type for empty plot) ──────────────────

function AddPlantModal({ visible, onClose, onAdd }) {
  const options = Object.entries(PLANT_TYPES);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Choose Your Seed 🌱</Text>
          <Text style={styles.sheetSub}>Each plant type grows differently</Text>
          {options.map(([key, val]) => {
            const seedImg = (PLANT_IMAGES[key] || PLANT_IMAGES.focus_tree).seed;
            return (
              <TouchableOpacity key={key} style={styles.sheetOption} onPress={() => onAdd(key)}>
                <Image source={seedImg} style={styles.sheetOptionImg} resizeMode="contain" />
                <Text style={styles.sheetOptionLabel}>{val.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── GardenSlot (single grid cell) ─────────────────────────────

function GardenSlot({ plant, onTapPlant, onTapEmpty }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    if (plant) {
      onTapPlant(plant);
    } else {
      onTapEmpty();
    }
  };

  if (!plant) {
    // Empty plot — soil with a "+" hint
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
        <Animated.View style={[styles.slot, { transform: [{ scale: scaleAnim }] }]}>
          <Image source={SOIL_IMAGE} style={styles.slotBg} resizeMode="cover" />
          <View style={styles.slotPlusOverlay}>
            <Ionicons name="add" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Occupied plot — grass + plant image
  const imageSet = PLANT_IMAGES[plant.type] || PLANT_IMAGES.focus_tree;
  const stageImg = imageSet[plant.stage] || imageSet.seed;

  // Size the plant based on stage (seed small, tree big)
  const plantScale = plant.stage === 'seed' ? 0.55 : plant.stage === 'bush' ? 0.72 : 0.88;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Animated.View style={[styles.slot, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={GRASS_IMAGE} style={styles.slotBg} resizeMode="cover" />
        <Image
          source={stageImg}
          style={[styles.slotPlant, {
            width: SLOT_SIZE * plantScale,
            height: SLOT_SIZE * plantScale,
          }]}
          resizeMode="contain"
        />
        {/* Tiny stage dot */}
        {plant.stage !== 'tree' && (
          <View style={styles.slotProgressDot}>
            <View style={[styles.slotProgressInner, {
              width: `${Math.round((plant.orbsInvested / (plant.nextStageThreshold || 5)) * 100)}%`
            }]} />
          </View>
        )}
        {plant.stage === 'tree' && (
          <View style={styles.slotStarBadge}>
            <Text style={styles.slotStar}>⭐</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── ForestScreen ──────────────────────────────────────────────

export default function ForestScreen() {
  const [plants, setPlants]           = useState([]);
  const [energyOrbs, setEnergyOrbs]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [slotForPlanting, setSlotForPlanting] = useState(null);
  const [feedback, setFeedback]       = useState('');
  const fadeAnim                      = useRef(new Animated.Value(0)).current;

  // Celebration
  const [celebVisible, setCelebVisible] = useState(false);
  const [celebPlant, setCelebPlant]     = useState({ type: 'focus_tree', stage: 'bush' });

  const showToast = (msg) => {
    setFeedback(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setFeedback(''));
  };

  const load = useCallback(async () => {
    try {
      const [plantsData, profileData] = await Promise.all([
        getPlants(),
        API.get('/auth/profile').then(r => r.data)
      ]);
      setPlants(plantsData);
      setEnergyOrbs(profileData.energyOrbs ?? 0);
    } catch (e) {
      console.log('ForestScreen load:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // ── Handlers ──

  const handleTapPlant = (plant) => {
    Vibration.vibrate(15);
    setSelectedPlant(plant);
  };

  const handleTapEmpty = () => {
    Vibration.vibrate(15);
    if (plants.length >= TOTAL_SLOTS) {
      showToast('Garden is full! 🌳');
      return;
    }
    setShowAddModal(true);
  };

  const handleGrow = async (plantId) => {
    if (energyOrbs < 1) {
      showToast('Need more orbs ⚡');
      return;
    }
    Vibration.vibrate(30);

    // Optimistic
    setEnergyOrbs(prev => prev - 1);

    try {
      const result = await growPlant(plantId);
      setEnergyOrbs(result.energyOrbs);
      const freshPlants = await getPlants();
      setPlants(freshPlants);

      // Update the selected plant in the detail modal
      const updated = freshPlants.find(p => p._id === plantId);
      if (updated) setSelectedPlant(updated);

      if (result.evolved) {
        setSelectedPlant(null); // Close detail
        setCelebPlant({ type: result.plant.type || 'focus_tree', stage: result.plant.stage });
        setCelebVisible(true);
      } else {
        showToast(result.msg);
      }
    } catch (err) {
      showToast(err.response?.data?.msg || 'Something went wrong');
      load();
    }
  };

  const handleAddPlant = async (type) => {
    setShowAddModal(false);
    try {
      await addPlant(type);
      await load();
      showToast('🌱 Seed planted!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Could not plant');
    }
  };

  // ── Build grid slots ──
  // First N slots = planted, rest = empty soil
  const gridSlots = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    gridSlots.push(i < plants.length ? plants[i] : null);
  }

  // Split into rows of GRID_COLS
  const gridRows = [];
  for (let i = 0; i < TOTAL_SLOTS; i += GRID_COLS) {
    gridRows.push(gridSlots.slice(i, i + GRID_COLS));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Image source={ORB_IMAGE} style={{ width: 56, height: 56, marginBottom: 16 }} />
          <Text style={styles.loadText}>Growing your forest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Garden 🌿</Text>
          <Text style={styles.headerSub}>{plants.length} plant{plants.length !== 1 ? 's' : ''} · {TOTAL_SLOTS - plants.length} plots free</Text>
        </View>
        <View style={styles.orbWallet}>
          <Image source={ORB_IMAGE} style={styles.orbWalletIcon} />
          <Text style={styles.orbCount}>{energyOrbs}</Text>
        </View>
      </View>

      {/* Toast */}
      {feedback !== '' && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{feedback}</Text>
        </Animated.View>
      )}

      {/* Garden grid */}
      <View style={styles.gardenContainer}>
        <View style={styles.gardenBorder}>
          {gridRows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((plant, ci) => (
                <GardenSlot
                  key={`${ri}-${ci}`}
                  plant={plant}
                  onTapPlant={handleTapPlant}
                  onTapEmpty={handleTapEmpty}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Garden legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#A5D6A7' }]} />
            <Text style={styles.legendText}>Planted</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D7CCC8' }]} />
            <Text style={styles.legendText}>Empty plot</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>⭐ Fully grown</Text>
          </View>
        </View>
      </View>

      {/* Tip */}
      <View style={styles.tipRow}>
        <Ionicons name="bulb-outline" size={14} color={colors.textMuted} />
        <Text style={styles.tipText}>Tap a plant to grow it · Tap empty soil to plant</Text>
      </View>

      {/* Modals */}
      <PlantDetailModal
        visible={!!selectedPlant}
        onClose={() => setSelectedPlant(null)}
        plant={selectedPlant}
        energyOrbs={energyOrbs}
        onGrow={handleGrow}
      />
      <AddPlantModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPlant}
      />
      <CelebrationModal
        visible={celebVisible}
        onClose={() => setCelebVisible(false)}
        plantType={celebPlant.type}
        newStage={celebPlant.stage}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { ...typography.body, color: colors.textSecondary },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary },
  headerSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  orbWallet: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFDE7', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#FFE082', gap: 6,
  },
  orbWalletIcon: { width: 22, height: 22 },
  orbCount: { ...typography.heading, color: '#F57F17', fontSize: 18, lineHeight: 22 },

  // Toast
  toast: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: '#1A1A1A', borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: 10, alignItems: 'center',
  },
  toastText: { ...typography.label, color: '#FFE082', fontWeight: '700', textAlign: 'center' },

  // Garden container
  gardenContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: GRID_PAD,
  },
  gardenBorder: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    padding: 10,
    borderWidth: 2,
    borderColor: '#A5D6A7',
    ...shadow.soft,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SLOT_GAP,
    marginBottom: SLOT_GAP,
  },

  // Garden slot
  slot: {
    width: SLOT_SIZE, height: SLOT_SIZE,
    borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#D7CCC8',
  },
  slotBg: {
    position: 'absolute', width: '100%', height: '100%',
  },
  slotPlusOverlay: {
    position: 'absolute', width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  slotPlant: {
    zIndex: 2,
  },
  slotProgressDot: {
    position: 'absolute', bottom: 4, left: 6, right: 6,
    height: 3, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 2,
    overflow: 'hidden',
  },
  slotProgressInner: {
    height: '100%', backgroundColor: '#66BB6A', borderRadius: 2,
  },
  slotStarBadge: {
    position: 'absolute', top: 3, right: 3,
  },
  slotStar: { fontSize: 12 },

  // Legend
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Tip
  tipRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingBottom: 12, paddingTop: 8,
  },
  tipText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // Detail modal
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  detailCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    width: '88%', alignItems: 'center', ...shadow.medium,
  },
  detailClose: {
    position: 'absolute', top: -8, right: -8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  detailImgWrap: {
    width: 140, height: 140, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  detailImg: { width: '100%', height: '100%' },
  detailName: { ...typography.heading, color: colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  detailStageBadge: {
    backgroundColor: colors.accentGreenLight, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: spacing.md,
  },
  detailStageText: { ...typography.caption, color: colors.accentGreen, fontWeight: '700' },
  detailProgressSection: { width: '100%', marginBottom: spacing.md },
  detailProgressTrack: {
    height: 10, backgroundColor: colors.divider, borderRadius: 5, overflow: 'hidden', marginBottom: 6,
  },
  detailProgressFill: {
    height: '100%', backgroundColor: colors.accentGreen, borderRadius: 5,
  },
  detailProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  detailProgressText: { ...typography.caption, color: colors.textSecondary },
  detailProgressNeed: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  detailMaxRow: { marginBottom: spacing.md },
  detailMaxText: { ...typography.label, color: colors.accentGreen, textAlign: 'center' },
  detailOrbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg,
    backgroundColor: '#FFFDE7', borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#FFE082',
  },
  detailOrbIcon: { width: 18, height: 18 },
  detailOrbText: { ...typography.caption, color: '#F57F17' },
  detailOrbBold: { fontWeight: '800' },
  detailGrowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accentGreen, borderRadius: radius.pill,
    paddingHorizontal: 24, paddingVertical: 14, width: '100%', justifyContent: 'center',
  },
  detailGrowBtnDisabled: { backgroundColor: colors.border },
  detailGrowOrbIcon: { width: 20, height: 20 },
  detailGrowText: { ...typography.label, color: '#FFFFFF', fontSize: 16 },

  // Celebration
  celebOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  celebCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: spacing.xl,
    alignItems: 'center', width: '85%', ...shadow.medium,
  },
  celebSparkle: { fontSize: 28, marginBottom: spacing.md },
  celebImg: { width: 140, height: 140, marginBottom: spacing.lg },
  celebTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 22, marginBottom: spacing.sm, textAlign: 'center' },
  celebSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 22 },
  celebBtn: {
    backgroundColor: colors.accentGreen, borderRadius: radius.pill,
    paddingHorizontal: 28, paddingVertical: 14, width: '100%', alignItems: 'center',
  },
  celebBtnText: { ...typography.label, color: '#FFFFFF', fontSize: 16 },

  // Add plant sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 36,
  },
  sheetTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: 4 },
  sheetSub: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  sheetOptionImg: { width: 44, height: 44 },
  sheetOptionLabel: { ...typography.subheading, color: colors.textPrimary, flex: 1 },
  sheetCancel: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.md },
  sheetCancelText: { ...typography.label, color: colors.danger },
});
