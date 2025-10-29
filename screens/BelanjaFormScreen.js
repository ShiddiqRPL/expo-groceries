// screens/BelanjaFormScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BelanjaFormScreen({ navigation }) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [namaBarang, setNamaBarang] = useState("");
  const [hargaTotalDisplay, setHargaTotalDisplay] = useState("");
  const [jumlahDisplay, setJumlahDisplay] = useState("");
  const [satuan, setSatuan] = useState("pcs");
  const [showDetail, setShowDetail] = useState(false);

  // --- Helpers ---
  const parseDigits = (value) => {
    const digits = value?.replace(/[^0-9]/g, "") || "";
    return digits ? parseInt(digits, 10) : 0;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const hargaTotalNum = parseDigits(hargaTotalDisplay);
  const jumlahNum = parseDigits(jumlahDisplay);
  const hargaSatuanNum = jumlahNum > 0 ? hargaTotalNum / jumlahNum : 0;

  const handleHargaTotalChange = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    setHargaTotalDisplay(digits ? formatNumber(parseInt(digits, 10)) : "");
  };

  const handleJumlahChange = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    setJumlahDisplay(digits ? formatNumber(parseInt(digits, 10)) : "");
  };

  const formatDate = (d) => {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- Persistence ---
  const STORAGE_KEY = "DAFTAR_BELANJA";

  const simpan = async (autoReset = false) => {
    const newData = {
      id: Date.now(),
      date: formatDate(date),
      namaBarang,
      hargaTotal: hargaTotalNum,
      jumlah: jumlahNum,
      satuan,
      hargaSatuan: hargaSatuanNum,
    };

    try {
      if (Platform.OS === "web") {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newData]));
        window.alert("Data tersimpan!");
      } else {
        const existing = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newData]));
        Alert.alert("Data tersimpan");
      }

      if (autoReset) resetForm();
      else navigation.navigate("DaftarBelanja");
    } catch (err) {
      console.error(err);
      Alert.alert("Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setDate(new Date());
    setNamaBarang("");
    setHargaTotalDisplay("");
    setJumlahDisplay("");
    setSatuan("pcs");
    setShowDetail(false);
  };

  const confirmReset = () => {
    if (namaBarang || hargaTotalDisplay || jumlahDisplay) {
      if (Platform.OS === "web") {
        const ok = window.confirm("Yakin ingin menghapus semua data?");
        if (ok) resetForm();
      } else {
        Alert.alert("Konfirmasi", "Yakin ingin menghapus semua data?", [
          { text: "Batal", style: "cancel" },
          { text: "Ya, hapus", style: "destructive", onPress: resetForm },
        ]);
      }
    } else {
      resetForm();
    }
  };

  // --- UI ---
  const inputLabelStyle = { marginBottom: 4 };
  const inputStyle = {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 16 }}>
          Form Belanja
        </Text>

        {/* Date Picker */}
        <Text style={inputLabelStyle}>Tanggal</Text>
        {Platform.OS === "web" ? (
          <input
            type="date"
            value={formatDate(date)}
            onChange={(e) => setDate(new Date(e.target.value))}
            style={{
              ...inputStyle,
              borderRadius: 4,
              paddingVertical: 10,
              paddingHorizontal: 12,
              width: "100%",
            }}
          />
        ) : (
          <TouchableOpacity onPress={() => setShowPicker(true)} style={inputStyle}>
            <Text style={{ color: "#000" }}>{formatDate(date)}</Text>
          </TouchableOpacity>
        )}
        {showPicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Nama Barang */}
        <Text style={inputLabelStyle}>Nama Barang</Text>
        <TextInput
          placeholder="Masukkan nama barang"
          placeholderTextColor="#9a9a9a"
          value={namaBarang}
          onChangeText={setNamaBarang}
          style={inputStyle}
        />

        {/* Harga Total */}
        <Text style={inputLabelStyle}>Harga Total</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: "#eee",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderWidth: 1,
              borderColor: "#ddd",
              marginRight: -1,
            }}
          >
            <Text>IDR</Text>
          </View>
          <TextInput
            placeholder="0"
            placeholderTextColor="#9a9a9a"
            keyboardType={Platform.OS === "web" ? "text" : "numeric"}
            value={hargaTotalDisplay}
            onChangeText={handleHargaTotalChange}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#fff",
            }}
          />
        </View>

        {/* Detail Harga */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text>Detail Harga</Text>
          <Switch value={showDetail} onValueChange={setShowDetail} />
        </View>

        {showDetail && (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <TextInput
                placeholder="Jumlah"
                placeholderTextColor="#9a9a9a"
                keyboardType={Platform.OS === "web" ? "text" : "numeric"}
                value={jumlahDisplay}
                onChangeText={handleJumlahChange}
                style={{ flex: 4, ...inputStyle }}
              />
              <TextInput
                placeholder="Satuan"
                placeholderTextColor="#9a9a9a"
                value={satuan}
                onChangeText={setSatuan}
                style={{ flex: 1, ...inputStyle }}
              />
            </View>
            <Text style={inputLabelStyle}>Harga Satuan</Text>
            <View style={{ ...inputStyle }}>
              <Text>
                {jumlahNum > 0 ? `IDR ${formatNumber(Math.floor(hargaSatuanNum))} per ${satuan}` : "-"}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 12,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <TouchableOpacity
          style={{ flex: 1, marginHorizontal: 6, paddingVertical: 12, borderRadius: 8, backgroundColor: "#aaa", alignItems: "center" }}
          onPress={confirmReset}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, marginHorizontal: 6, paddingVertical: 12, borderRadius: 8, backgroundColor: "#007AFF", alignItems: "center" }}
          onPress={() => simpan(false)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Simpan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, marginHorizontal: 6, paddingVertical: 12, borderRadius: 8, backgroundColor: "#28a745", alignItems: "center" }}
          onPress={() => simpan(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Simpan & Buat Lagi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
