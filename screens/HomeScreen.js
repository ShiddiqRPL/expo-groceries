import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selamat Datang 👋</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BelanjaForm")}>
        <Text style={styles.buttonText}>Belanja</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("DaftarBelanja")}>
        <Text style={styles.buttonText}>Daftar Belanja</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => alert("Laporan belum tersedia")}>
        <Text style={styles.buttonText}>Laporan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f7f7f7" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: "center" },
  button: { backgroundColor: "#007AFF", paddingVertical: 15, borderRadius: 12, marginVertical: 10, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
