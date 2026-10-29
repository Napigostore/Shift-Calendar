import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { buildCountdowns, fmtShort, leaveSummary } from '../countdown';
import { FREE_LIMITS } from '../pro';
import { useStore } from '../store';
import { CountdownEvent } from '../types';
import { EventEditor } from './EventEditor';
import { haptic } from './ui';
import { Text } from './AppText';
import { Icon } from './Icon';

/** Dải thẻ đếm ngược ngang: kỳ nghỉ, ngày lương, Tết, ngày lễ, ngày nghỉ, phép năm. */
export function CountdownStrip({ onOpenLeave }: { onOpenLeave: () => void }) {
  const { data, t, c, lunarOn, holidaysOn, requirePro } = useStore();
  const [editing, setEditing] = useState<CountdownEvent | 'new' | null>(null);
  // Chỉ tính lại khi phần dữ liệu liên quan đổi (không phải mỗi lần sửa một ngày của người khác / cài đặt khác)
  const sched = data.schedule[data.activeEmployeeId];
  const s = data.settings;
  const items = useMemo(
    () => buildCountdowns(data, t, lunarOn, holidaysOn),
    [sched, data.events, data.customHolidays, data.shiftTypes, s.payday, s.language, s.holidayIcon, t, lunarOn, holidaysOn], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const leave = useMemo(
    () => leaveSummary(data, data.activeEmployeeId, new Date().getFullYear()),
    [sched, data.employees, data.shiftTypes, s.leaveDaysPerYear, s.leaveCarryOver], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!data.settings.showCountdown) return null;

  return (
    <View style={{ marginHorizontal: -16, marginBottom: 16 }}>
      <Text style={[styles.header, { color: c.text2 }]}>{t.countdown.toUpperCase()}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
        {items.map((it) => {
          const label = it.ongoing ? t.ongoing : it.days === 0 ? t.today : it.days === 1 ? t.tomorrow : t.daysLeft;
          const big = it.ongoing ? '🎉' : it.days <= 1 ? '' : String(it.days);
          return (
            <Pressable
              key={it.kind + it.id}
              onPress={() => {
                haptic();
                if (it.kind === 'event') setEditing(data.events.find((e) => e.id === it.id) ?? null);
              }}
            >
              <LinearGradient colors={[it.color, shade(it.color)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
                <View style={styles.tileTop}>
                  <Text style={{ fontSize: 22 }}>{it.icon}</Text>
                  <Text style={styles.date}>
                    {fmtShort(it.date)}
                    {it.endDate && it.endDate.getTime() !== it.date.getTime() ? `–${fmtShort(it.endDate)}` : ''}
                  </Text>
                </View>
                <View style={{ marginTop: 'auto' }}>
                  {big ? <Text style={styles.big}>{big}</Text> : null}
                  <Text style={[styles.label, !big && { fontSize: 22, fontWeight: '700' }]}>{label}</Text>
                  <Text style={styles.title} numberOfLines={1}>
                    {it.title}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}

        {/* Phép năm */}
        {data.settings.features.leave && (
        <Pressable
          onPress={() => {
            haptic();
            onOpenLeave();
          }}
        >
          <View style={[styles.tile, { backgroundColor: c.card }]}>
            <View style={styles.tileTop}>
              <Icon name="airplane" size={20} color={c.purple} />
              <Text style={[styles.date, { color: c.text2 }]}>{new Date().getFullYear()}</Text>
            </View>
            <View style={{ marginTop: 'auto' }}>
              <Text style={[styles.big, { color: leave.remaining < 0 ? c.red : c.purple }]}>{leave.remaining}</Text>
              <Text style={[styles.label, { color: c.text2 }]}>/ {leave.total} {t.days}</Text>
              <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
                {t.annualLeave}
              </Text>
            </View>
          </View>
        </Pressable>
        )}

        {/* Thêm kỳ nghỉ */}
        <Pressable
          onPress={() => {
            haptic();
            if (data.events.length >= FREE_LIMITS.events && !requirePro('events')) return;
            setEditing('new');
          }}
        >
          <View style={[styles.tile, styles.add, { borderColor: c.separator }]}>
            <Icon name="add-circle" size={34} color={c.accent} />
            <Text style={{ color: c.accent, fontWeight: '600', marginTop: 6, textAlign: 'center' }}>{t.addEvent}</Text>
          </View>
        </Pressable>
      </ScrollView>
      <EventEditor event={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

/** Màu đậm hơn cho đuôi gradient. */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.72));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

const styles = StyleSheet.create({
  header: { fontSize: 13, marginLeft: 32, marginBottom: 8 },
  tile: { width: 128, height: 140, borderRadius: 18, padding: 12 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  date: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
  big: { color: '#fff', fontSize: 36, fontWeight: '700', lineHeight: 40 },
  label: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  title: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  add: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
