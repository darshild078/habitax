import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUnauthorizedHandler } from './src/services/authEvents';

// Screens
import SplashLoader    from './src/components/SplashLoader';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen     from './src/screens/LoginScreen';
import RegisterScreen  from './src/screens/RegisterScreen';
import HomeScreen      from './src/screens/HomeScreen';
import AddHabitScreen  from './src/screens/AddHabitScreen';
import EditHabitScreen from './src/screens/EditHabitScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import TrackerScreen   from './src/screens/TrackerScreen';
import ForestScreen    from './src/screens/ForestScreen';

// Theme
import colors from './src/theme/colors';
import typography from './src/theme/typography';

// ─────────────────────────────────────────────────────────────
// Bottom Tab Bar
// A purely custom tab bar — no navigation library needed.
// ─────────────────────────────────────────────────────────────

const TABS = [
  { key: 'home',    label: 'Home',    icon: '🏠' },
  { key: 'tracker', label: 'Track',   icon: '✅' },
  { key: 'forest',  label: 'Forest',  icon: '🌳' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

function TabBar({ activeTab, onPress }) {
  return (
    <View style={tabStyles.bar}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={tabStyles.tab}
            onPress={() => onPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.icon, isActive && tabStyles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={tabStyles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.45,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#BBBBBB',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

// ─────────────────────────────────────────────────────────────
// Root App with tab + stack navigation via plain state machine
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]         = useState('loading');
  const [activeTab, setActiveTab]   = useState('home');
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => setScreen('login'));

    const bootstrap = async () => {
      try {
        const [token, onboarded] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('onboarded'),
        ]);
        if (token)          setScreen('tabs');
        else if (!onboarded) setScreen('onboarding');
        else                 setScreen('login');
      } catch {
        setScreen('login');
      }
    };
    bootstrap();
  }, []);

  // ── Handlers ──
  const goToEdit = (habit) => { setSelectedHabit(habit); setScreen('edit'); };
  const editGoBack = () => { setSelectedHabit(null); setScreen('tabs'); };

  // ── Auth screens ──
  if (screen === 'loading')    return <SplashLoader />;
  if (screen === 'onboarding') return <OnboardingScreen goToLogin={() => setScreen('login')} />;
  if (screen === 'login')
    return <LoginScreen
      goToHome={() => setScreen('tabs')}
      goToRegister={() => setScreen('register')}
    />;
  if (screen === 'register')
    return <RegisterScreen
      goToHome={() => setScreen('tabs')}
      goToLogin={() => setScreen('login')}
    />;

  // ── Stack screens (overlay on top of tabs) ──
  if (screen === 'add')
    return <AddHabitScreen goBack={() => setScreen('tabs')} />;
  if (screen === 'edit' && selectedHabit)
    return <EditHabitScreen habit={selectedHabit} goBack={editGoBack} />;
  if (screen === 'tracker')
    return <TrackerScreen goBack={() => setScreen('tabs')} />;

  // ── Main tab shell ──
  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            goToAdd={() => setScreen('add')}
            goToLogin={() => setScreen('login')}
            goToEdit={goToEdit}
            goToProfile={() => setActiveTab('profile')}
            goToTracker={() => setScreen('tracker')}
          />
        );
      case 'forest':
        return <ForestScreen />;
      case 'tracker':
        return <TrackerScreen goBack={() => setActiveTab('home')} />;
      case 'profile':
        return <ProfileScreen goBack={() => setActiveTab('home')} goToLogin={() => setScreen('login')} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderTab()}
      <TabBar activeTab={activeTab} onPress={setActiveTab} />
    </View>
  );
}