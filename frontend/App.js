import { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import AddHabitScreen from "./src/screens/AddHabitScreen";

export default function App() {
  const [screen, setScreen] = useState("home");

  return screen === "home" ? (
    <HomeScreen goToAdd={() => setScreen("add")} />
  ) : (
    <AddHabitScreen goBack={() => setScreen("home")} />
  );
}