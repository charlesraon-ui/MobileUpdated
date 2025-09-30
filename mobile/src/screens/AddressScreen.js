import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState("");

  const add = () => {
    if (!newAddress.trim()) return;
    setAddresses([...addresses, newAddress.trim()]);
    setNewAddress("");
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Manage Addresses</Text>
      <TextInput
        value={newAddress}
        onChangeText={setNewAddress}
        placeholder="Enter address"
        style={s.input}
      />
      <Button title="Add Address" onPress={add} />

      <FlatList
        data={addresses}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) => <Text style={s.item}>🏠 {item}</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 12 },
  item: { fontSize: 16, marginTop: 8 },
});
