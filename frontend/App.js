import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUnauthorizedHandler } from './src/services/authEvents';
import SplashLoader from './src/components/SplashLoader';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import EditHabitScreen from './src/screens/EditHabitScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TrackerScreen from './src/screens/TrackerScreen';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    // Register 401 auto-logout handler
    registerUnauthorizedHandler(() => {
      setScreen('login');
    });

    const bootstrap = async () => {
      try {
        const [token, onboarded] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('onboarded'),
        ]);
        if (token) {
          setScreen('home');
        } else if (!onboarded) {
          setScreen('onboarding');
        } else {
          setScreen('login');
        }
      } catch (err) {
        setScreen('login');
      }
    };
    bootstrap();
  }, []);

  const goToEdit = (habit) => {
    setSelectedHabit(habit);
    setScreen('edit');
  };

  const editGoBack = () => {
    setSelectedHabit(null);
    setScreen('home');
  };

  if (screen === 'loading') return <SplashLoader />;

  if (screen === 'onboarding')
    return <OnboardingScreen goToLogin={() => setScreen('login')} />;

  if (screen === 'login')
    return (
      <LoginScreen
        goToHome={() => setScreen('home')}
        goToRegister={() => setScreen('register')}
      />
    );

  if (screen === 'register')
    return (
      <RegisterScreen
        goToHome={() => setScreen('home')}
        goToLogin={() => setScreen('login')}
      />
    );

  if (screen === 'home')
    return (
      <HomeScreen
        goToAdd={() => setScreen('add')}
        goToLogin={() => setScreen('login')}
        goToEdit={goToEdit}
        goToProfile={() => setScreen('profile')}
        goToTracker={() => setScreen('tracker')}
      />
    );

  if (screen === 'tracker')
    return <TrackerScreen goBack={() => setScreen('home')} />;

  if (screen === 'add')
    return <AddHabitScreen goBack={() => setScreen('home')} />;

  if (screen === 'edit' && selectedHabit)
    return <EditHabitScreen habit={selectedHabit} goBack={editGoBack} />;

  if (screen === 'profile')
    return <ProfileScreen goBack={() => setScreen('home')} />;

  return (
    <LoginScreen
      goToHome={() => setScreen('home')}
      goToRegister={() => setScreen('register')}
    />
  );
}