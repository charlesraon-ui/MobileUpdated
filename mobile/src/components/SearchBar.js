import Ionicons from "@expo/vector-icons/Ionicons";
import { useContext } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function SearchBar({ onOpenFilters }) {
  const { searchQuery, setSearchQuery } = useContext(AppCtx);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingHorizontal: 10,
        marginBottom: 10,
      }}
    >
      {/* Search Icon (doesn’t steal focus) */}
      <View pointerEvents="none" style={{ marginRight: 6 }}>
        <Ionicons name="search" size={18} color="#6B7280" />
      </View>

      <TextInput
        style={{ flex: 1, paddingVertical: 8, fontSize: 14 }}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        blurOnSubmit={false}
      />

      {/* Clear button */}
      {searchQuery?.length > 0 && (
        <TouchableOpacity
          onPress={() => setSearchQuery("")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 6 }}
        >
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {/* Optional filter button */}
      {onOpenFilters && (
        <TouchableOpacity
          onPress={onOpenFilters}
          style={{
            marginLeft: 8,
            backgroundColor: "#059669",
            padding: 8,
            borderRadius: 999,
          }}
        >
          <Ionicons name="options" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
