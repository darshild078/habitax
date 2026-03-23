import { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import AddHabitScreen from "./src/screens/AddHabitScreen";
import LoginScreen from "./src/screens/LoginScreen";

export default function App() {
  const [screen, setScreen] = useState("login");

  if (screen === "login") {
    return <LoginScreen goToHome={() => setScreen("home")} />;
  }

  if (screen === "home") {
    return <HomeScreen goToAdd={() => setScreen("add")} />;
  }

  if (screen === "add") {
    return <AddHabitScreen goBack={() => setScreen("home")} />;
  }
}