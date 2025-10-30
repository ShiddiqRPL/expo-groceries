import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HeaderBackButton } from "@react-navigation/elements";

const STORAGE_KEY = "DAFTAR_BELANJA";
const PAGE_SIZE = 20; // load 20 items per batch

// Helper functions
const groupByDate = (data) =>
  Object.entries(
    data.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {})
  ).map(([date, items]) => ({ title: date, data: items }));

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

export default function DaftarBelanjaScreen({ navigation }) {
  const [showFilter, setShowFilter] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [data, setData] = useState([]);
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // Multi-select
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Load full data
  useEffect(() => {
    const loadData = async () => {
      let stored = [];
      try {
        if (Platform.OS === "web") {
          stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } else {
          const result = await AsyncStorage.getItem(STORAGE_KEY);
          stored = result ? JSON.parse(result) : [];
        }
      } catch (err) {
        console.error(err);
      }
      setData(stored);
    };
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  // Header
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
      headerLeft: ({ canGoBack }) =>
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
        ),
    });
  }, [navigation, showFilter, selectionMode, selectedIds]);

  // Filtered data
  const filteredData = data.filter((item) => {
    const d = new Date(item.date);
    if (isNaN(d)) return false;
    if (!fromDate && !toDate) return true;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  // Lazy-loaded slice
  const displayedData = filteredData.slice(0, loadedCount);
  const groupedData = groupByDate(displayedData);

  const loadMore = () => {
    if (loadingMore || loadedCount >= filteredData.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setLoadedCount((prev) => Math.min(prev + PAGE_SIZE, filteredData.length));
      setLoadingMore(false);
    }, 300); // simulate load delay
  };

  // Multi-select toggle
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
      const confirmed = window.confirm(
        `Yakin ingin menghapus ${selectedIds.size} item?`
      );
      if (!confirmed) return;
      const remaining = data.filter((item) => !selectedIds.has(item.id));
      setData(remaining);
      setSelectionMode(false);
      setSelectedIds(new Set());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      Alert.alert("Hapus item", `Yakin ingin menghapus ${selectedIds.size} item?`, [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const remaining = data.filter((item) => !selectedIds.has(item.id));
            setData(remaining);
            setSelectionMode(false);
            setSelectedIds(new Set());
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
          },
        },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
                    value={fromDate || new Date()}
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
                    value={toDate || new Date()}
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

          <TouchableOpacity
            disabled={!(fromDate || toDate)}
            style={[
              styles.resetButton,
              !(fromDate || toDate) ? styles.resetButtonDisabled : ""
            ]}
            onPress={() => {
              setFromDate(null);
              setToDate(null);
            }}
          >
            <Ionicons name="refresh-outline" size={16} color="#007AFF" style={[
              !(fromDate || toDate) ? styles.resetButtonTextDisabled : ""
            ]} />
            <Text style={[
              styles.resetButtonText,
              !(fromDate || toDate) ? styles.resetButtonTextDisabled : ""
            ]}>Reset Filter</Text>
          </TouchableOpacity>
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

      {/* SectionList for lazy loading */}
      <SectionList
        sections={groupedData}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ padding: 20 }}
        ListFooterComponent={
          loadingMore && <ActivityIndicator size="small" color="#007AFF" />
        }
        renderSectionHeader={({ section, index }) => {
          const records = section.data;
          const allSelected = records.every((r) => selectedIds.has(r.id));
          const partiallySelected = !allSelected && records.some((r) => selectedIds.has(r.id));

          const handleGroupToggle = () => {
            const newSet = new Set(selectedIds);
            if (allSelected) {
              records.forEach((r) => newSet.delete(r.id));
            } else {
              records.forEach((r) => newSet.add(r.id));
            }
            setSelectedIds(newSet);
          };

          const totalPerDay = records.reduce((sum, r) => sum + r.hargaTotal, 0);
          const isFirstRecord = index === 0;

          return (
            <View 
              style={[
                styles.dateHeader,
                !isFirstRecord ? { paddingTop: 12, paddingBottom: 0 } : {},
              ]}
            >
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
              <Text style={styles.dateText}>{formatDateLabel(section.title)}</Text>
              <Text style={styles.totalText}>IDR {formatCurrency(totalPerDay)}</Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (selectionMode) toggleSelect(item.id);
              else navigation.navigate("BelanjaForm", { editItem: item });
            }}
            onLongPress={() => handleLongPress(item.id)}
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
        )}
      />
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
  dateHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4, paddingVertical: 8},
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
  resetButtonDisabled: {
    backgroundColor: "#e4e4e4ff",
    borderColor: "#b6b6b6ff",
    cursor: "not-allowed",
  },
  resetButtonText: {
    color: "#007AFF",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "500",
  },
  resetButtonTextDisabled: {
    color: "#a5a5a5ff",
  },
});
