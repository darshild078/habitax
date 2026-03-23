import { View, Text, TextInput, Button, Alert } from "react-native";
import { useState } from "react";
import API from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ goToHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      console.log("Trying login...");

      const res = await API.post("/auth/login", {
        email,
        password
      });

      console.log("LOGIN SUCCESS:", res.data);

      // Save token
      await AsyncStorage.setItem("token", res.data.token);

      Alert.alert("Success", "Login successful ✅");

      // Navigate to home
      goToHome();

    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);

      Alert.alert(
        "Login Failed",
        err.response?.data?.msg || "Something went wrong"
      );
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Login 🔐
      </Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 8,
          marginBottom: 15
        }}
      />

      <Text>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 8,
          marginBottom: 20
        }}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}