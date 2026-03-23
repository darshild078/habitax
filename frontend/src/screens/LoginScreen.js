import { View, Text, TextInput, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import API from "../services/api"

export default function LoginScreen({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", {
        email,
        password
      });
  
      console.log("LOGIN SUCCESS:", res.data);
  
      // Store token
      await AsyncStorage.setItem("token", res.data.token);
      console.log("Token saved");
      setIsLoggedIn(true);
  
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email</Text>
      <TextInput
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
        onChangeText={setEmail}
      />

      <Text>Password</Text>
      <TextInput
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}