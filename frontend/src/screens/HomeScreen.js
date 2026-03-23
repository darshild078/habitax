import { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import API from "../services/api";

export default function HomeScreen({ goToAdd }) {
  const [dashboard, setDashboard] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const dashRes = await API.get("/habits/dashboard");
      const habitRes = await API.get("/habits/get");

      setDashboard(dashRes.data);
      setHabits(habitRes.data);

    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteHabit = (id) => {
    Alert.alert(
      "Delete Habit",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await API.delete(`/habits/delete/${id}`);
            fetchData();
          }
        }
      ]
    );
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Loading...</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        HabiTax 💸
      </Text>

      {dashboard && (
        <View style={{
          backgroundColor: "#1E1E1E",
          padding: 15,
          borderRadius: 10,
          marginTop: 15
        }}>
          <Text style={{ color: "#fff", fontSize: 18 }}>
            You burned ₹{dashboard.totalYearlyCost}
          </Text>

          <Text style={{ color: "#aaa" }}>
            Lost {dashboard.totalHoursLost} hours
          </Text>
        </View>
      )}

      <Text style={{ marginTop: 20, fontSize: 18 }}>
        Your Habits
      </Text>

      {habits.map((habit) => (
        <View
          key={habit._id}
          style={{
            backgroundColor: "#2C2C2E",
            padding: 15,
            borderRadius: 10,
            marginTop: 10
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>
            {habit.name}
          </Text>

          <Text style={{ color: "#ff453a" }}>
            ₹{habit.yearlyCost}/year
          </Text>

          <Text style={{ color: "#aaa" }}>
            {habit.insight}
          </Text>

          <Button
            title="Delete ❌"
            onPress={() => deleteHabit(habit._id)}
          />
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        <Button title="Add Habit ➕" onPress={goToAdd} />
      </View>
    </View>
  );
}