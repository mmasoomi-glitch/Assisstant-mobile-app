import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BRAND } from "../../constants/Brand";
import { apiFetch } from "../../services/api";

type Heartbeat = { status: string; uptime_seconds?: number };

export default function Dashboard() {
  const [beat, setBeat] = useState<Heartbeat | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Heartbeat>("/api/health")
      .then((r) => {
        if (r.ok) setBeat(r.data);
        else setErr(r.error?.message || "Unavailable");
      })
      .catch(() => setErr("Network error"));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Good day</Text>
      <Text style={styles.muted}>AFAQ OS mobile — scaffold</Text>

      <Card>
        <Text style={styles.cardTitle}>Backend</Text>
        <Text style={styles.cardBody}>
          {beat ? `${beat.status} · ${beat.uptime_seconds ?? "?"}s` : err ?? "Checking…"}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Next steps</Text>
        <Text style={styles.cardBody}>
          Real modules ship during the slot-12 dev pass. This scaffold proves the
          envelope, brand tokens, and tab shell work end-to-end.
        </Text>
      </Card>
    </ScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
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
    marginBottom: 12,
  },
  cardTitle: { color: BRAND.accent, fontSize: 14, letterSpacing: 0.5 },
  cardBody: { color: BRAND.text, marginTop: 6, lineHeight: 20 },
});
