import { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';

export default function App() {
  const [screen, setScreen] = useState('login');

  if (screen === 'login') {
    return (
      <LoginScreen
        goToHome={() => setScreen('home')}
        goToRegister={() => setScreen('register')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        goToHome={() => setScreen('home')}
        goToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        goToAdd={() => setScreen('add')}
        goToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'add') {
    return (
      <AddHabitScreen
        goBack={() => setScreen('home')}
      />
    );
  }
}