import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { almanac } from '../almanac';
import { useStore } from '../store';
import { Text } from './AppText';
import { Icon } from './Icon';

/** Lịch vạn niên của ngày: can chi, hoàng đạo/hắc đạo, giờ hoàng đạo, tiết khí. */
export function AlmanacCard({ d, m, y }: { d: number; m: number; y: number }) {
  const { data, t, c } = useStore();
  const a = useMemo(() => almanac(d, m, y, data.settings.language), [d, m, y, data.settings.language]);
  const tone = a.good ? c.green : c.gray;

  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <View style={styles.head}>
        <Text style={{ color: c.text2, fontSize: 13, fontWeight: '600' }}>{t.almanac.toUpperCase()}</Text>
        <View style={[styles.tag, { backgroundColor: tone + '26' }]}>
          <Icon name={a.good ? 'sunny' : 'cloudy-night'} size={12} color={tone} />
          <Text style={{ color: tone, fontSize: 12, fontWeight: '700' }}>{a.good ? t.goodDay : t.badDay}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Cell label={t.dayCanChi} value={a.dayName} />
        <Cell label={t.monthCanChi} value={a.monthName} />
        <Cell label={a.termStarts ? t.termStarts : t.solarTerm} value={a.term} highlight={a.termStarts} />
      </View>
      <Text style={{ color: c.text2, fontSize: 13, marginTop: 10 }}>
        ✦ {a.god}
      </Text>

      <Text style={{ color: c.text2, fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 }}>{t.goodHours}</Text>
      <View style={styles.hours}>
        {a.goodHours.map((h) => (
          <View key={h.chi} style={[styles.hour, { backgroundColor: c.dark ? c.card2 : c.bg }]}>
            <Text style={{ fontSize: 16 }}>{h.icon}</Text>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{h.chi}</Text>
            <Text style={{ color: c.text2, fontSize: 11 }}>{h.range}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const { c } = useStore();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: highlight ? c.orange : c.text2, fontSize: 11 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginTop: 2 }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, marginTop: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  grid: { flexDirection: 'row', gap: 10 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hour: { width: '31.8%', borderRadius: 10, paddingVertical: 8, alignItems: 'center', gap: 1 },
});
