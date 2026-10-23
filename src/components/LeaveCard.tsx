import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { leaveSummary } from '../countdown';
import { useStore } from '../store';
import { Card } from './ui';
import { Text } from './AppText';
import { Icon } from './Icon';

/** Thẻ phép năm: thanh tiến độ đã dùng / đã xếp / còn lại. */
export function LeaveCard({ year, onPress }: { year: number; onPress?: () => void }) {
  const { data, t, c } = useStore();
  const L = useMemo(() => leaveSummary(data, data.activeEmployeeId, year), [data, year]);
  const total = Math.max(1, L.total);
  const over = L.remaining < 0;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <View style={styles.head}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="airplane" size={18} color={c.purple} />
            <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>
              {t.annualLeave} {year}
            </Text>
          </View>
          {onPress ? <Icon name="chevron-forward" size={18} color={c.text3} /> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 }}>
          <Text style={{ color: over ? c.red : c.purple, fontSize: 40, fontWeight: '700' }}>{L.remaining}</Text>
          <Text style={{ color: c.text2, fontSize: 17, marginBottom: 7, marginLeft: 6 }}>
            / {L.total} {t.days} · {t.leaveRemaining.toLowerCase()}
          </Text>
        </View>

        <View style={[styles.bar, { backgroundColor: c.fill }]}>
          <View style={{ flex: Math.min(L.used, total), backgroundColor: c.purple }} />
          <View style={{ flex: Math.min(L.planned, Math.max(0, total - L.used)), backgroundColor: c.purple + '70' }} />
          <View style={{ flex: Math.max(0, L.remaining) }} />
        </View>

        <View style={styles.legend}>
          <Legend color={c.purple} label={t.leaveUsed} value={L.used} />
          <Legend color={c.purple + '70'} label={t.leavePlanned} value={L.planned} />
          <Legend color={c.fill} label={t.leaveRemaining} value={Math.max(0, L.remaining)} />
        </View>

        {over ? (
          <View style={[styles.warn, { backgroundColor: c.red + '22' }]}>
            <Icon name="warning" size={16} color={c.red} />
            <Text style={{ color: c.red, fontSize: 13, fontWeight: '600', flex: 1 }}>{t.leaveOver}</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  const { c } = useStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color: c.text2, fontSize: 13 }}>
        {label} <Text style={{ color: c.text, fontWeight: '600' }}>{value}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', rowGap: 6 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, marginTop: 12 },
});
