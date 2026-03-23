import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import API from "../services/api";

export default function HomeScreen({ goToAdd}) {
  const [dashboard, setDashboard] = useState(null);
  const [habits, setHabits] = useState([]);

  // 🔥 Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Dashboard
      const dashRes = await API.get("/habits/dashboard");
      setDashboard(dashRes.data);

      // Habits list
      const habitRes = await API.get("/habits/get");
      setHabits(habitRes.data);

    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Welcome to HabiTax 💸</Text>

      {/* Dashboard */}
      {dashboard && (
        <>
          <Text>Yearly Cost: ₹{dashboard.totalYearlyCost}</Text>
          <Text>Hours Lost: {dashboard.totalHoursLost}</Text>
        </>
      )}

      <Text style={{ marginTop: 20 }}>Your Habits:</Text>

      {/* Habit List */}
      {habits.map((habit, index) => (
        <View key={index} style={{ marginTop: 10 }}>
          <Text>{habit.name}</Text>
          <Text>₹{habit.yearlyCost}/year</Text>
          <Text>{habit.insight}</Text>
        </View>
      ))}
      <Button title="Add Habit ➕" onPress={goToAdd} />
    </View>
  );
}