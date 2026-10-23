import React, { useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AlmanacCard } from '../components/AlmanacCard';
import { AutoSchedule } from '../components/AutoSchedule';
import { CountdownStrip } from '../components/CountdownStrip';
import { DayEditor } from '../components/DayEditor';
import { EmployeeBar } from '../components/EmployeeBar';
import { QuoteCard } from '../components/QuoteCard';
import { Btn, Card, Chip, haptic, IconBtn, LargeTitle, Screen } from '../components/ui';
import { WeatherCard } from '../components/WeatherCard';
import { getHolidays } from '../holidays';
import { canChiYear, solarToLunar } from '../lunar';
import { computeMonth } from '../stats';
import { readableOn, shiftCellLook } from '../theme';
import { useStore } from '../store';
import { dateKey, daysInMonth, formatMoney, formatTime, keyOf, parseKey } from '../utils';
import { Text } from '../components/AppText';
import { Icon } from '../components/Icon';

type YM = { y: number; m: number };

function stepMonth(setYm: React.Dispatch<React.SetStateAction<YM>>, delta: number) {
  haptic();
  setYm(({ y, m }) => {
    const d = new Date(y, m - 1 + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });
}

export function CalendarScreen({ onOpenLeave }: { onOpenLeave: () => void }) {
  const { data, t, c, setDay, lunarOn, holidaysOn } = useStore();
  const s = data.settings;
  const now = new Date();
  const todayKey = keyOf(now);
  const [ym, setYm] = useState<YM>({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [selected, setSelected] = useState(todayKey);
  const [editing, setEditing] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [painting, setPainting] = useState(false);
  const [brush, setBrush] = useState<string | null>(null);

  const empId = data.activeEmployeeId;
  const sched = data.schedule[empId] ?? {};
  const compact = s.monthStyle === 'compact';
  const cellH = compact ? 52 : 66;

  const move = (delta: number) => stepMonth(setYm, delta);

  // Vuốt ngang để đổi tháng
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) stepMonth(setYm, 1);
        else if (g.dx > 50) stepMonth(setYm, -1);
      },
    }),
  );

  const cells = useMemo(() => {
    const first = new Date(ym.y, ym.m - 1, 1).getDay();
    const lead = (first - s.firstDayOfWeek + 7) % 7;
    const n = daysInMonth(ym.y, ym.m);
    const out: (number | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= n; d++) out.push(d);
    while (out.length % 7) out.push(null);
    return out;
  }, [ym, s.firstDayOfWeek]);

  const stats = useMemo(() => computeMonth(data, empId, ym.y, ym.m), [data, empId, ym]);
  const weekdays = Array.from({ length: 7 }, (_, i) => (i + s.firstDayOfWeek) % 7);
  const lunarMid = solarToLunar(15, ym.m, ym.y);
  const isCurrentMonth = ym.y === now.getFullYear() && ym.m === now.getMonth() + 1;

  const onDay = (d: number) => {
    const key = dateKey(ym.y, ym.m, d);
    haptic();
    if (painting && brush) {
      const cur = sched[key]?.shifts ?? [];
      const next = cur.includes(brush) ? cur.filter((x) => x !== brush) : s.shiftsPerDay === 1 ? [brush] : [...cur, brush].slice(-s.shiftsPerDay);
      setDay(empId, key, { ...(sched[key] ?? {}), shifts: next });
      return;
    }
    if (key === selected) setEditing(key);
    else setSelected(key);
  };

  return (
    <Screen>
      <LargeTitle
        eyebrow={`${ym.y}${lunarOn ? ` · ${canChiYear(lunarMid.year)}` : ''}`}
        title={`${t.month} ${ym.m}`}
        right={
          <>
            {!isCurrentMonth && (
              <Pressable
                onPress={() => {
                  haptic();
                  setYm({ y: now.getFullYear(), m: now.getMonth() + 1 });
                  setSelected(todayKey);
                }}
                style={[styles.todayPill, { backgroundColor: c.accentSoft }]}
              >
                <Text style={{ color: c.accent, fontWeight: '600', fontSize: 15 }}>{t.today}</Text>
              </Pressable>
            )}
            <IconBtn name="chevron-back" onPress={() => move(-1)} />
            <IconBtn name="chevron-forward" onPress={() => move(1)} />
          </>
        }
      />

      <EmployeeBar />
      <QuoteCard />
      <CountdownStrip onOpenLeave={onOpenLeave} />

      {/* Lưới lịch */}
      <View style={[styles.calendar, { backgroundColor: c.card }]} {...pan.panHandlers}>
        <View style={styles.week}>
          {weekdays.map((wd) => (
            <Text key={wd} style={[styles.wd, { color: s.highlightWeekends && (wd === 0 || wd === 6) ? c.weekend : c.text2 }]}>
              {t.weekdaysShort[wd]}
            </Text>
          ))}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <View key={r} style={[styles.week, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separator }]}>
            {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
              if (!d) return <View key={i} style={[styles.cell, { height: cellH }]} />;
              const key = dateKey(ym.y, ym.m, d);
              const wd = new Date(ym.y, ym.m - 1, d).getDay();
              const weekend = wd === 0 || wd === 6;
              const lunar = solarToLunar(d, ym.m, ym.y);
              const hols = getHolidays(d, ym.m, ym.y, s.language, data.customHolidays, holidaysOn, s.holidayIcon);
              const offHol = hols.some((h) => h.off);
              const entry = sched[key];
              const shiftList = (entry?.shifts ?? []).map((id) => data.shiftTypes.find((x) => x.id === id)).filter((x) => !!x);
              const isToday = key === todayKey;
              const isSel = key === selected;
              const isPayday = s.payday > 0 && d === Math.min(s.payday, daysInMonth(ym.y, ym.m));
              const badge = entry?.icons?.[0] ?? hols[0]?.icon ?? (isPayday ? '💰' : undefined);
              const look = shiftList[0] ? shiftCellLook(shiftList[0].kind, shiftList[0].color, c.dark) : null;
              const onNight = !!look?.night;
              const numColor = isToday
                ? '#fff'
                : isSel
                  ? onNight || c.dark
                    ? '#000'
                    : '#fff'
                  : offHol
                    ? c.red
                    : s.highlightWeekends && weekend
                      ? c.weekend
                      : onNight
                        ? '#FFFFFF'
                        : c.text;
              return (
                <Pressable
                  key={i}
                  onPress={() => onDay(d)}
                  style={[styles.cell, { height: cellH }, look?.bg ? [styles.cellFilled, { backgroundColor: look.bg }] : null]}
                >
                  <View
                    style={[
                      styles.num,
                      isToday && { backgroundColor: c.red },
                      isSel && !isToday && { backgroundColor: onNight ? '#FFFFFF' : c.text },
                    ]}
                  >
                    <Text style={[styles.numText, { color: numColor, fontWeight: isToday || isSel ? '700' : '500' }]}>{d}</Text>
                  </View>
                  {badge ? <Text style={styles.badge}>{badge}</Text> : null}
                  {lunarOn && s.showLunar && !compact ? (
                    <Text style={[styles.lunar, { color: lunar.day === 1 ? c.orange : onNight ? 'rgba(255,255,255,0.55)' : c.text3 }]}>{lunar.day === 1 ? `${lunar.day}/${lunar.month}` : lunar.day}</Text>
                  ) : null}
                  <View style={styles.pills}>
                    {shiftList.slice(0, compact ? 1 : 2).map((sh, j) => (
                      <View key={j} style={[styles.pill, { backgroundColor: sh.color }]}>
                        <Text style={[styles.pillText, { color: readableOn(sh.color) }]} numberOfLines={1}>
                          {sh.short}
                        </Text>
                      </View>
                    ))}
                    {entry?.otHours ? <View style={[styles.otDot, { backgroundColor: c.orange }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Thanh công cụ */}
      {s.features.quickTools && (
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: painting ? 10 : 20 }}>
        <Btn
          title={t.quickPaint}
          icon="brush"
          kind={painting ? 'filled' : 'tinted'}
          style={{ flex: 1, paddingVertical: 11 }}
          onPress={() => {
            setPainting(!painting);
            if (!brush) setBrush(data.shiftTypes[0]?.id ?? null);
          }}
        />
        <Btn title={t.autoSchedule} icon="sparkles" kind="tinted" color={c.orange} style={{ flex: 1, paddingVertical: 11 }} onPress={() => setAuto(true)} />
      </View>
      )}
      {painting && s.features.quickTools && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: c.text2, fontSize: 13, marginBottom: 8, marginLeft: 4 }}>{t.quickPaintHint}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {data.shiftTypes.map((sh) => (
              <Chip key={sh.id} label={sh.name} color={sh.color} active={brush === sh.id} onPress={() => setBrush(sh.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      {!painting && <DayAgenda dayKey={selected} onEdit={() => setEditing(selected)} />}

      <WeatherCard />

      {/* Tổng kết tháng */}
      <Card>
        <Text style={{ color: c.text2, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>{t.thisMonth.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Stat label={t.workDays} value={stats.workDays} color={c.accent} />
          <Stat label={t.nightShifts} value={stats.nightShifts} color={c.indigo} />
          <Stat label={t.totalOT} value={`${stats.otHours}h`} color={c.orange} />
          <Stat label={t.offDays} value={stats.offDays} color={c.gray} />
        </View>
        {s.features.salary && (
          <View style={[styles.salary, { borderTopColor: c.separator }]}>
            <Text style={{ color: c.text, fontSize: 17 }}>{t.salary}</Text>
            <Text style={{ color: c.green, fontSize: 22, fontWeight: '700' }}>{formatMoney(stats.total)}</Text>
          </View>
        )}
      </Card>

      <DayEditor dayKey={editing} onClose={() => setEditing(null)} />
      {auto && <AutoSchedule visible onClose={() => setAuto(false)} year={ym.y} month={ym.m} />}
    </Screen>
  );
}

/** Danh sách sự kiện của ngày đang chọn (kiểu Apple Calendar). */
function DayAgenda({ dayKey, onEdit }: { dayKey: string; onEdit: () => void }) {
  const { data, t, c, lunarOn, holidaysOn } = useStore();
  const s = data.settings;
  const [y, m, d] = parseKey(dayKey);
  const date = new Date(y, m - 1, d);
  const entry = data.schedule[data.activeEmployeeId]?.[dayKey];
  const shifts = (entry?.shifts ?? []).map((id) => data.shiftTypes.find((x) => x.id === id)).filter((x) => !!x);
  const hols = getHolidays(d, m, y, s.language, data.customHolidays, holidaysOn, s.holidayIcon);
  const lunar = solarToLunar(d, m, y);

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 }}>
        <View>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>
            {t.weekdaysLong[date.getDay()]}, {d}/{m}
          </Text>
          {lunarOn ? (
            <Text style={{ color: c.text2, fontSize: 13, marginTop: 1 }}>
              {t.lunar} {lunar.day}/{lunar.month}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onEdit} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: c.accent, fontSize: 17 }}>{t.edit}</Text>
          {entry?.icons?.length ? <Text style={{ fontSize: 18 }}>{entry.icons.join('')}</Text> : null}
        </Pressable>
      </View>
      <Pressable onPress={onEdit}>
        <View style={{ backgroundColor: c.card, borderRadius: 14, overflow: 'hidden' }}>
          {hols.map((h, i) => (
            <View key={'h' + i} style={[styles.agendaRow, { borderBottomColor: c.separator }]}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{h.icon}</Text>
              <Text style={{ color: h.off ? c.red : c.text, fontSize: 16, flex: 1 }}>{h.name}</Text>
            </View>
          ))}
          {shifts.map((sh, i) => (
            <View key={'s' + i} style={[styles.agendaRow, { borderBottomColor: c.separator }]}>
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: sh.color, marginHorizontal: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{sh.name}</Text>
                {sh.hours > 0 ? (
                  <Text style={{ color: c.text2, fontSize: 14, marginTop: 1 }}>
                    {formatTime(sh.start, s.clock24h)} – {formatTime(sh.end, s.clock24h)} · {sh.hours}
                    {t.hours}
                  </Text>
                ) : null}
              </View>
              {sh.alarmEnabled && sh.hours > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Icon name="alarm-outline" size={15} color={c.orange} />
                  <Text style={{ color: c.orange, fontSize: 14 }}>{formatTime(sh.alarmTime, s.clock24h)}</Text>
                </View>
              ) : null}
            </View>
          ))}
          {entry?.otHours ? (
            <View style={[styles.agendaRow, { borderBottomColor: c.separator }]}>
              <Icon name="flash" size={18} color={c.orange} style={{ width: 28, textAlign: 'center' }} />
              <Text style={{ color: c.text, fontSize: 16 }}>
                OT +{entry.otHours}
                {t.hours}
              </Text>
            </View>
          ) : null}
          {entry?.note ? (
            <View style={[styles.agendaRow, { borderBottomColor: c.separator }]}>
              <Icon name="document-text-outline" size={18} color={c.text2} style={{ width: 28, textAlign: 'center' }} />
              <Text style={{ color: c.text2, fontSize: 15, flex: 1 }}>{entry.note}</Text>
            </View>
          ) : null}
          {!shifts.length && !hols.length && !entry?.note ? (
            <View style={[styles.agendaRow, { borderBottomWidth: 0, justifyContent: 'center' }]}>
              <Icon name="add-circle" size={20} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 16 }}>{t.nothingPlanned}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {lunarOn && s.features.almanac ? <AlmanacCard d={d} m={m} y={y} /> : null}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const { c } = useStore();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color, fontSize: 24, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: c.text2, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  todayPill: { paddingHorizontal: 12, height: 34, borderRadius: 17, justifyContent: 'center' },
  calendar: { borderRadius: 16, paddingHorizontal: 4, paddingBottom: 4, marginBottom: 14 },
  week: { flexDirection: 'row' },
  wd: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', paddingVertical: 9 },
  cell: { flex: 1, alignItems: 'center', paddingTop: 4 },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 17 },
  badge: { position: 'absolute', top: 1, right: 1, fontSize: 10 },
  lunar: { fontSize: 9, marginTop: -1 },
  cellFilled: { borderRadius: 10, marginHorizontal: 1.5, marginVertical: 2 },
  pills: { position: 'absolute', bottom: 4, left: 3, right: 3, gap: 2, flexDirection: 'row' },
  pill: { flex: 1, borderRadius: 5, paddingVertical: 1.5, alignItems: 'center' },
  pillText: { fontSize: 10, fontWeight: '700' },
  otDot: { position: 'absolute', top: -8, right: 0, width: 6, height: 6, borderRadius: 3 },
  salary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 12 },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingVertical: 10, paddingRight: 14, paddingLeft: 6, borderBottomWidth: StyleSheet.hairlineWidth },
});
