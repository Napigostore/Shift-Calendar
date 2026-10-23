import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStore } from '../store';
import { dateKey, daysInMonth, keyOf } from '../utils';
import { haptic } from './ui';

/** Xem trước widget màn hình chính: ca hôm nay, nút đổi ca nhanh, lịch mini. */
export function WidgetPreview() {
  const { data, t, c, setDay } = useStore();
  const s = data.settings;
  const now = new Date();
  const key = keyOf(now);
  const empId = data.activeEmployeeId;
  const sched = data.schedule[empId] ?? {};
  const today = (sched[key]?.shifts ?? []).map((id) => data.shiftTypes.find((x) => x.id === id)).filter(Boolean);
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lead = (new Date(y, m - 1, 1).getDay() - s.firstDayOfWeek + 7) % 7;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1)];
  const main = today[0];
  const colors: [string, string] =
    s.widgetBackground === 'accent' ? [c.accent, c.indigo] : s.widgetBackground === 'transparent' ? [c.card + 'AA', c.card + 'AA'] : ['#1C1C1E', '#0B0B0D'];
  const fg = s.widgetBackground === 'transparent' ? c.text : '#fff';

  return (
    <LinearGradient colors={colors} style={{ borderRadius: 22, padding: 16, marginBottom: 24 }}>
      <Text style={{ color: s.widgetBackground === 'accent' ? '#fff' : c.red, fontSize: 12, fontWeight: '700' }}>
        {t.weekdaysLong[now.getDay()].toUpperCase()}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={{ color: fg, fontSize: 40, fontWeight: '300', letterSpacing: -1 }}>{now.getDate()}</Text>
        <View style={{ alignItems: 'flex-end', marginBottom: 6 }}>
          <Text style={{ color: main?.color ?? fg, fontSize: 18, fontWeight: '700' }}>{today.map((x) => x!.name).join(' + ') || t.noShift}</Text>
          {main && main.hours > 0 ? (
            <Text style={{ color: fg, opacity: 0.7, fontSize: 13 }}>
              {main.start} – {main.end}
            </Text>
          ) : null}
        </View>
      </View>
      {s.widgetQuickButtons && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          {data.shiftTypes.slice(0, 4).map((sh) => (
            <Pressable
              key={sh.id}
              onPress={() => {
                haptic();
                setDay(empId, key, { ...(sched[key] ?? {}), shifts: [sh.id] });
              }}
              style={{ flex: 1, backgroundColor: sh.color, borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>{sh.short}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!s.widgetCompact && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
          {cells.map((d, i) => {
            const sh = d ? data.shiftTypes.find((x) => x.id === sched[dateKey(y, m, d)]?.shifts[0]) : undefined;
            const isToday = d === now.getDate();
            return (
              <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 }}>
                {d ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? c.red : 'transparent' }}>
                    <Text style={{ color: fg, fontSize: 11, fontWeight: isToday ? '700' : '500' }}>{d}</Text>
                    {sh && !isToday ? <View style={{ position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: sh.color }} /> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </LinearGradient>
  );
}
