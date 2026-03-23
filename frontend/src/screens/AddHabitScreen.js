import { View, Text, TextInput, Button } from "react-native";
import { useState } from "react";
import API from "../services/api";

export default function AddHabitScreen({ goBack}) {
  // 🧠 State for inputs
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("");

  // 🔥 Function to send data
  const handleAddHabit = async () => {
    try {
      console.log("Sending habit...");

      const res = await API.post("/habits/add", {
        name,
        costPerUse: Number(cost),
        frequencyType: frequency,
        frequencyValue: 1,
        timePerUse: Number(time)
      });
      goBack();

      console.log("Habit added:", res.data);

      // reset form
      setName("");
      setCost("");
      setTime("");

    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Habit Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Text>Cost per use (₹)</Text>
      <TextInput
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Text>Time per use (minutes)</Text>
      <TextInput
        value={time}
        onChangeText={setTime}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      <Button title="Add Habit" onPress={handleAddHabit} />
    </View>
  );
}