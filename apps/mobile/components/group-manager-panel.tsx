import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchFundraiserUsesGroups,
  fetchGroupManagerRoster,
  fetchGroupManagerScoreboard,
  fetchGroupManagerSummary,
  type GroupRosterRow,
  type GroupScoreboardRow,
  type GroupSummaryRow,
} from "../lib/group-manager-data";

type Props = {
  fundraiserId: string;
  title?: string;
};

function money(n: string | number): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (!Number.isFinite(v)) return "—";
  return `$${v.toFixed(2)}`;
}

export default function GroupManagerPanel({ fundraiserId, title }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usesGroups, setUsesGroups] = useState(false);
  const [scoreboard, setScoreboard] = useState<GroupScoreboardRow[]>([]);
  const [summary, setSummary] = useState<GroupSummaryRow | null>(null);
  const [roster, setRoster] = useState<GroupRosterRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const ug = await fetchFundraiserUsesGroups(fundraiserId);
    setUsesGroups(ug);
    if (!ug) {
      setScoreboard([]);
      setSummary(null);
      setRoster([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const [sb, sm, ro] = await Promise.all([
      fetchGroupManagerScoreboard(fundraiserId),
      fetchGroupManagerSummary(fundraiserId),
      fetchGroupManagerRoster(fundraiserId),
    ]);
    const errs = [sb.error, sm.error, ro.error].filter(Boolean);
    if (errs.length) setErr(errs.join("\n"));
    setScoreboard(sb.rows ?? []);
    setSummary(sm.row);
    setRoster(ro.rows ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [fundraiserId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (!usesGroups) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.h1}>{title ?? "Group manager"}</Text>
        <Text style={styles.muted}>
          This campaign is not using teams and groups. The Lead Organizer can turn
          that on in the web dashboard.
        </Text>
      </ScrollView>
    );
  }

  if (scoreboard.length === 0 && !summary && !err) {
    return (
      <ScrollView
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.h1}>{title ?? "Group manager"}</Text>
        <Text style={styles.body}>
          Groups are enabled but no scoreboard rows loaded yet. Ask your Lead
          Organizer to create groups on the web dashboard, then pull to refresh. If
          groups already exist and this persists, try signing out and back in.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.padBottom}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.h1}>{title ?? "Group manager"}</Text>
      <Text style={styles.sub}>
        Scoreboard shows each team&apos;s total only. Detailed stats below are for
        your group.
      </Text>

      {err ? (
        <Text style={styles.errBox} selectable>
          {err}
        </Text>
      ) : null}

      <Text style={styles.section}>Campaign scoreboard</Text>
      {scoreboard.map((row) => (
        <View key={row.group_id} style={styles.row}>
          <Text style={styles.rowTitle}>{row.group_name}</Text>
          <Text style={styles.rowValue}>{money(row.total_raised)}</Text>
        </View>
      ))}
      {scoreboard.length === 0 ? (
        <Text style={styles.muted}>No groups yet.</Text>
      ) : null}

      {scoreboard.length > 0 && !summary ? (
        <Text style={styles.noteBox}>
          You can see the campaign scoreboard. To see{" "}
          <Text style={{ fontWeight: "700" }}>your group’s</Text> roster and detailed
          stats, the Lead Organizer must assign you as a group manager on the web.
        </Text>
      ) : null}

      {summary ? (
        <>
          <Text style={styles.section}>Your group · {summary.group_name}</Text>
          <View style={styles.card}>
            <Text style={styles.statLine}>
              Participants:{" "}
              <Text style={styles.statEm}>{summary.participant_count}</Text>
            </Text>
            <Text style={styles.statLine}>
              Donations (#):{" "}
              <Text style={styles.statEm}>{summary.donation_count}</Text>
            </Text>
            <Text style={styles.statLine}>
              Total raised:{" "}
              <Text style={styles.statEm}>{money(summary.raised_total)}</Text>
            </Text>
            <Text style={styles.statLine}>
              Texts sent:{" "}
              <Text style={styles.statEm}>{summary.texts_sent}</Text>
            </Text>
            <Text style={styles.statLine}>
              Avg texts / participant:{" "}
              <Text style={styles.statEm}>
                {summary.avg_texts_per_participant != null
                  ? String(summary.avg_texts_per_participant)
                  : "—"}
              </Text>
            </Text>
          </View>

          <Text style={styles.section}>Roster · your group only</Text>
          {roster.map((r) => (
            <View key={r.athlete_id} style={styles.rosterCard}>
              <Text style={styles.rosterName}>{r.full_name}</Text>
              <Text style={styles.rosterMeta}>
                Donations {r.donation_count} · {money(r.raised_total)} raised ·{" "}
                {r.texts_sent} texts
              </Text>
            </View>
          ))}
        </>
      ) : scoreboard.length > 0 ? null : (
        <Text style={styles.muted}>
          No manager summary loaded (assignment or permissions).
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pad: { padding: 16, paddingBottom: 32 },
  padBottom: { padding: 16, paddingBottom: 48 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  h1: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 18,
  },
  section: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#475569",
    marginTop: 20,
    marginBottom: 8,
  },
  body: { fontSize: 15, color: "#334155", lineHeight: 22 },
  muted: { fontSize: 14, color: "#64748b", lineHeight: 20 },
  errBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    color: "#991b1b",
    marginBottom: 12,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  rowValue: { fontSize: 16, fontWeight: "700", color: "#C0392B" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  statLine: { fontSize: 14, color: "#475569" },
  statEm: { fontWeight: "700", color: "#1A1A2E" },
  rosterCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rosterName: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  rosterMeta: { fontSize: 13, color: "#64748b", marginTop: 4 },
  noteBox: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 8,
  },
});
