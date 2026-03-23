import { View, Text, TextInput, Button, Alert } from "react-native";
import { useState } from "react";
import API from "../services/api";

export default function AddHabitScreen({ goBack }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [time, setTime] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const handleAddHabit = async () => {
    try {
      if (!name || !cost || !time) {
        Alert.alert("Error", "Please fill all fields");
        return;
      }

      await API.post("/habits/add", {
        name,
        costPerUse: Number(cost),
        frequencyType: frequency,
        frequencyValue: 1,
        timePerUse: Number(time)
      });

      Alert.alert("Success", "Habit added ✅");

      setName("");
      setCost("");
      setTime("");

      goBack();

    } catch (err) {
      console.log(err.response?.data || err.message);

      Alert.alert(
        "Error",
        err.response?.data?.msg || "Failed to add habit"
      );
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Add Habit ➕
      </Text>

      <Text style={{ marginTop: 15 }}>Habit Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Coffee"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text style={{ marginTop: 15 }}>Cost (₹)</Text>
      <TextInput
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text style={{ marginTop: 15 }}>Time (minutes)</Text>
      <TextInput
        value={time}
        onChangeText={setTime}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text style={{ marginTop: 15 }}>Frequency</Text>

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {["daily", "weekly", "monthly"].map((item) => (
          <Text
            key={item}
            onPress={() => setFrequency(item)}
            style={{
              marginRight: 10,
              padding: 10,
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor:
                frequency === item ? "#007AFF" : "transparent",
              color: frequency === item ? "#fff" : "#000"
            }}
          >
            {item}
          </Text>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Add Habit" onPress={handleAddHabit} />
      </View>
    </View>
  );
}