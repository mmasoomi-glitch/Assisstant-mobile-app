import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BRAND } from "../../constants/Brand";

export default function More() {
  const items = [
    { label: "Accounting (AfaqBooks)", status: "Web" },
    { label: "Inventory", status: "Web" },
    { label: "Commission", status: "Web" },
    { label: "Settings", status: "Scaffold" },
  ];
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>More</Text>
      <Text style={styles.muted}>
        Not yet ported to mobile — use web at afaq24.store.ngrok.pizza.
      </Text>
      {items.map((i) => (
        <View key={i.label} style={styles.card}>
          <Text style={styles.cardTitle}>{i.label}</Text>
          <Text style={styles.cardBody}>{i.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.bg },
  content: { padding: 20 },
  h1: { color: BRAND.text, fontSize: 26, fontWeight: "700" },
  muted: { color: BRAND.muted, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: BRAND.glass,
    borderColor: BRAND.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { color: BRAND.accent, fontSize: 14 },
  cardBody: { color: BRAND.muted, marginTop: 4, fontSize: 13 },
});
