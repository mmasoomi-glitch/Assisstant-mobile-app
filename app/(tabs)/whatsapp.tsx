import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BRAND } from "../../constants/Brand";

export default function WhatsApp() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>WhatsApp</Text>
      <Text style={styles.muted}>Inbox + outreach — scaffold.</Text>
      <View style={styles.card}>
        <Text style={styles.cardBody}>
          Real threads load from /api/whatsapp/threads during slot-12.
        </Text>
      </View>
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
    padding: 16,
  },
  cardBody: { color: BRAND.text, lineHeight: 20 },
});
