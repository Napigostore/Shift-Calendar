import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useStore } from '../store';
import { dateKey, daysInMonth, parseKey } from '../utils';
import { haptic } from './ui';
import { Text } from './AppText';
import { Icon } from './Icon';

/** Lịch nhỏ chọn ngày (hoặc khoảng ngày khi có `end`). */
export function DatePicker({
  value,
  end,
  onChange,
}: {
  value: string;
  end?: string;
  onChange: (start: string, end?: string) => void;
}) {
  const { data, t, c } = useStore();
  const fdw = data.settings.firstDayOfWeek;
  const [y0, m0] = parseKey(value);
  const [ym, setYm] = useState({ y: y0, m: m0 });
  const range = end !== undefined;
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const lead = (new Date(ym.y, ym.m - 1, 1).getDay() - fdw + 7) % 7;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth(ym.y, ym.m) }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const move = (delta: number) => {
    haptic();
    const d = new Date(ym.y, ym.m - 1 + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() + 1 });
  };

  const pick = (d: number) => {
    haptic();
    const key = dateKey(ym.y, ym.m, d);
    if (!range) return onChange(key);
    if (picking === 'start' || key < value) {
      onChange(key, key);
      setPicking('end');
    } else {
      onChange(value, key);
      setPicking('start');
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: c.card }]}>
      <View style={styles.head}>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>
          {t.month} {ym.m}, {ym.y}
        </Text>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Pressable hitSlop={10} onPress={() => move(-1)}>
            <Icon name="chevron-back" size={22} color={c.accent} />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => move(1)}>
            <Icon name="chevron-forward" size={22} color={c.accent} />
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        {Array.from({ length: 7 }, (_, i) => (
          <Text key={i} style={[styles.wd, { color: c.text3 }]}>
            {t.weekdaysShort[(i + fdw) % 7].toUpperCase()}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const key = dateKey(ym.y, ym.m, d);
            const isStart = key === value;
            const isEnd = range && key === end;
            const inRange = range && end && key > value && key < end;
            const on = isStart || isEnd;
            return (
              <Pressable key={i} onPress={() => pick(d)} style={styles.cell}>
                {inRange || (range && end && end !== value && (isStart || isEnd)) ? (
                  <View
                    style={[
                      styles.band,
                      { backgroundColor: c.accentSoft },
                      isStart && { left: '50%' },
                      isEnd && { right: '50%' },
                    ]}
                  />
                ) : null}
                <View style={[styles.dot, on && { backgroundColor: c.accent }]}>
                  <Text style={{ color: on ? '#fff' : c.text, fontSize: 17, fontWeight: on ? '700' : '400' }}>{d}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, padding: 12, marginBottom: 24 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  row: { flexDirection: 'row' },
  wd: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: 3, bottom: 3, left: 0, right: 0 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
