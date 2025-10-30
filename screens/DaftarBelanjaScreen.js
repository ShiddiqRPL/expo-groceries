import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Load data from storage on mount
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
        console.log("Loaded data:", stored);
      } catch (err) {
        console.error(err);
      }
    };

    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  // 🔹 Header Filter button
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Daftar Belanja",
      headerRight: () => (
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
    });
  }, [navigation, showFilter]);

  // 🔹 Filter the data by date range
  const filteredData = data.filter((item) => {
    const d = new Date(item.date);

    if (isNaN(d)) return false; // skip invalid dates

    // if no filter is selected, show everything
    if (!fromDate && !toDate) return true;

    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;

    return true;
  });

  const groupedData = groupByDate(filteredData);

  return (
    <View style={styles.container}>
      {/* Filter section */}
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
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    backgroundColor: "#fff",
                    fontSize: 14,
                  }}
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
                    {fromDate.toLocaleDateString("id-ID")}
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
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    backgroundColor: "#fff",
                    fontSize: 14,
                  }}
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
                    {toDate.toLocaleDateString("id-ID")}
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

      {/* Filter summary label */}
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

      {/* Scrollable list */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {Object.keys(groupedData)
          .sort((a, b) => new Date(b) - new Date(a))
          .map((date) => {
            const records = groupedData[date];
            const totalPerDay = records.reduce((sum, r) => sum + r.hargaTotal, 0);

            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{formatDateLabel(date)}</Text>
                  <Text style={styles.totalText}>
                    IDR {formatCurrency(totalPerDay)}
                  </Text>
                </View>

                {records.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    style={styles.cardTouchable}
                    onPress={() => navigation.navigate("BelanjaForm", { editItem: item })}
                  >
                    <View style={styles.card}>
                      <View>
                        <Text style={styles.namaBarang}>{item.namaBarang}</Text>
                        {item.jumlah > 0 && (
                          <Text style={styles.itemDetail}>
                            {formatCurrency(item.jumlah)} {item.satuan} × IDR{" "}
                            {formatCurrency(item.hargaTotal / item.jumlah)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.hargaTotal}>
                        IDR {formatCurrency(item.hargaTotal)}
                      </Text>
                    </View>
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
