import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HeaderBackButton } from "@react-navigation/elements";

const STORAGE_KEY = "DAFTAR_BELANJA";

// --- Helper functions ---
const groupByDate = (data) =>
  data.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const weekday = d.toLocaleString("en-US", { weekday: "short" });
  return `${day}-${month}-${year} (${weekday})`;
};

const formatCurrency = (num) =>
  new Intl.NumberFormat("id-ID").format(Math.round(num || 0));

// --- Main component ---
export default function DaftarBelanjaScreen({ navigation }) {
  const [showFilter, setShowFilter] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [data, setData] = useState([]);

  // 🟢 Multi-select states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        let stored = [];
        if (Platform.OS === "web") {
          stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } else {
          const result = await AsyncStorage.getItem(STORAGE_KEY);
          stored = result ? JSON.parse(result) : [];
        }
        setData(stored);
      } catch (err) {
        console.error(err);
      }
    };

    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  // 🔹 Header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: selectionMode
        ? `${selectedIds.size} dipilih`
        : "Daftar Belanja",
      headerRight: () =>
        selectionMode ? (
          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={{
              marginRight: 16,
              backgroundColor: "#FF3B30",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowFilter((prev) => !prev)}
            style={{
              marginRight: 16,
              backgroundColor: showFilter ? "#FF3B30" : "#007AFF",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Ionicons
              name={showFilter ? "close-outline" : "filter-outline"}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        ),
      headerLeft: ({ canGoBack }) => (
        selectionMode ? (
          <TouchableOpacity
            onPress={() => {
              setSelectionMode(false);
              setSelectedIds(new Set());
            }}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="close-outline" size={24} color="#333" />
          </TouchableOpacity>
        ) : (
          canGoBack && <HeaderBackButton onPress={() => navigation.goBack()} />
        )
      ),
    });
  }, [navigation, showFilter, selectionMode, selectedIds]);

  // 🔹 Filtering
  const filteredData = data.filter((item) => {
    const d = new Date(item.date);
    if (isNaN(d)) return false;
    if (!fromDate && !toDate) return true;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  const groupedData = groupByDate(filteredData);

  // 🔹 Multi-select handlers
  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleLongPress = (id) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleDeleteSelected = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Yakin ingin menghapus ${selectedIds.size} item?`);
      if (!confirmed) return;

      const remaining = data.filter(item => !selectedIds.has(item.id));
      setData(remaining);
      setSelectionMode(false);
      setSelectedIds(new Set());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      Alert.alert(
        "Hapus item",
        `Yakin ingin menghapus ${selectedIds.size} item?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              const remaining = data.filter(item => !selectedIds.has(item.id));
              setData(remaining);
              setSelectionMode(false);
              setSelectedIds(new Set());
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Filter Section */}
      {showFilter && (
        <View style={styles.filterContainer}>
          {/* From Date */}
          <View style={styles.webDateWrapper}>
            {Platform.OS === "web" ? (
              <>
                <Text style={styles.dateLabel}>Dari: </Text>
                <input
                  type="date"
                  value={fromDate?.toISOString().split("T")[0] ?? ""}
                  onChange={(e) => setFromDate(new Date(e.target.value))}
                  style={styles.webDateInput}
                />
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowFromPicker(true)}
                  style={styles.dateInputWrapper}
                >
                  <Text style={styles.dateLabel}>Dari: </Text>
                  <Text style={styles.dateValue}>
                    {fromDate?.toLocaleDateString("id-ID") ?? "-"}
                  </Text>
                </TouchableOpacity>
                {showFromPicker && (
                  <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={(e, selected) => {
                      setShowFromPicker(false);
                      if (selected) setFromDate(selected);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* To Date */}
          <View style={styles.webDateWrapper}>
            {Platform.OS === "web" ? (
              <>
                <Text style={styles.dateLabel}>Sampai: </Text>
                <input
                  type="date"
                  value={toDate?.toISOString().split("T")[0] ?? ""}
                  onChange={(e) => setToDate(new Date(e.target.value))}
                  style={styles.webDateInput}
                />
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowToPicker(true)}
                  style={styles.dateInputWrapper}
                >
                  <Text style={styles.dateLabel}>Sampai: </Text>
                  <Text style={styles.dateValue}>
                    {toDate?.toLocaleDateString("id-ID") ?? "-"}
                  </Text>
                </TouchableOpacity>
                {showToPicker && (
                  <DateTimePicker
                    value={toDate}
                    mode="date"
                    display="default"
                    onChange={(e, selected) => {
                      setShowToPicker(false);
                      if (selected) setToDate(selected);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {(fromDate || toDate) && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setFromDate(null);
                setToDate(null);
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#007AFF" />
              <Text style={styles.resetButtonText}>Reset Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 🔹 Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {(() => {
            const total = data.length;
            const shown = filteredData.length;

            if (!fromDate && !toDate) {
              return `Showing all ${total} record${total !== 1 ? "s" : ""}`;
            }

            let rangeText = "";
            if (fromDate && toDate) {
              rangeText = `from ${fromDate.toLocaleDateString("id-ID")} to ${toDate.toLocaleDateString("id-ID")}`;
            } else if (fromDate) {
              rangeText = `from ${fromDate.toLocaleDateString("id-ID")}`;
            } else if (toDate) {
              rangeText = `until ${toDate.toLocaleDateString("id-ID")}`;
            }

            return `Showing ${shown} of ${total} record${total !== 1 ? "s" : ""} (${rangeText})`;
          })()}
        </Text>
      </View>

      {/* 🔹 List */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {Object.keys(groupedData)
          .sort((a, b) => new Date(b) - new Date(a))
          .map((date) => {
            const records = groupedData[date];
            const totalPerDay = records.reduce((sum, r) => sum + r.hargaTotal, 0);

            // check if all items in this date group are selected
            const allSelected = records.every((r) => selectedIds.has(r.id));
            const partiallySelected = !allSelected && records.some((r) => selectedIds.has(r.id));

            const handleGroupToggle = () => {
              const newSet = new Set(selectedIds);

              if (allSelected) {
                // unselect all in this date
                records.forEach((r) => newSet.delete(r.id));
              } else {
                // select all in this date
                records.forEach((r) => newSet.add(r.id));
              }

              setSelectedIds(newSet);
            };

            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  {selectionMode && (
                    <TouchableOpacity onPress={handleGroupToggle} style={styles.groupCheckbox}>
                      <Ionicons
                        name={
                          allSelected
                            ? "checkbox"
                            : partiallySelected
                            ? "remove-circle-outline"
                            : "square-outline"
                        }
                        size={22}
                        color={allSelected || partiallySelected ? "#007AFF" : "#ccc"}
                      />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.dateText}>{formatDateLabel(date)}</Text>
                  <Text style={styles.totalText}>IDR {formatCurrency(totalPerDay)}</Text>
                </View>

                {records.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onLongPress={() => setSelectionMode(true)}
                    onPress={() => {
                      if (selectionMode) {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(item.id)) newSet.delete(item.id);
                        else newSet.add(item.id);
                        setSelectedIds(newSet);
                      }
                    }}
                    style={[
                      styles.card,
                      selectionMode && selectedIds.has(item.id) && styles.cardSelected,
                    ]}
                  >
                    {selectionMode && (
                      <Ionicons
                        name={selectedIds.has(item.id) ? "checkbox" : "square-outline"}
                        size={22}
                        color={selectedIds.has(item.id) ? "#007AFF" : "#ccc"}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.namaBarang}>{item.namaBarang}</Text>
                      {item.jumlah > 0 && (
                        <Text style={styles.itemDetail}>
                          {formatCurrency(item.jumlah)} {item.satuan} × IDR{" "}
                          {formatCurrency(item.hargaTotal / item.jumlah)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.hargaTotal}>IDR {formatCurrency(item.hargaTotal)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}

// --- Styles (same as your existing ones) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  webDateWrapper: { flexDirection: "row", alignItems: "center", marginHorizontal: 6 },
  dateInputWrapper: { flexDirection: "row", alignItems: "center" },
  dateLabel: { fontSize: 14, color: "#333" },
  dateValue: { fontSize: 14, color: "#007AFF", fontWeight: "500" },
  dateGroup: { marginBottom: 20 },
  dateHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4 },
  dateText: { fontSize: 16, fontWeight: "700", color: "#333" },
  groupCheckbox: { marginRight: 8 },
  totalText: { fontSize: 16, fontWeight: "700", color: "#007AFF" },
  cardTouchable: { borderRadius: 12, overflow: "hidden", marginBottom: 10, },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: "#E6F0FF",
  },
  namaBarang: { fontSize: 15, color: "#333", fontWeight: "600" },
  itemDetail: { fontSize: 13, color: "#666", marginTop: 2 },
  hargaTotal: { fontSize: 15, fontWeight: "700", color: "#007AFF" },
  summaryContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#eef6ff",
    borderBottomWidth: 1,
    borderColor: "#cde0ff",
  },
  summaryText: {
    fontSize: 13,
    color: "#007AFF",
    textAlign: "center",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#eaf3ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#007AFF33",
    alignSelf: "center",
  },
  resetButtonText: {
    color: "#007AFF",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "500",
  },
});
