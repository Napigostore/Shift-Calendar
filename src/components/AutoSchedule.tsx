import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { getHolidays } from '../holidays';
import { maybeShowInterstitial } from '../services/ads';
import { useStore } from '../store';
import { DayEntry } from '../types';
import { daysInMonth, keyOf } from '../utils';
import { Chip, Group, haptic, ListRow, Segmented, Sheet, Stepper, Toggle } from './ui';
import { Text } from './AppText';

type Mode = 'cycle' | 'office';

/** Tự chia ca: lặp chu kỳ ca hoặc lịch hành chính, tự đánh dấu ngày lễ. */
export function AutoSchedule({ visible, onClose, year, month }: { visible: boolean; onClose: () => void; year: number; month: number }) {
  const { data, t, c, setDays, requirePro } = useStore();
  const types = data.shiftTypes;
  const ofKind = (kind: string) => types.filter((s) => s.kind === kind).map((s) => s.id);
  const [d1, d2] = ofKind('day');
  const nightId = ofKind('night')[0];
  const offId = ofKind('off')[0];
  const holidayId = ofKind('holiday')[0];

  const presets = useMemo(() => {
    const short = (id?: string) => types.find((s) => s.id === id)?.short ?? '?';
    const list: (string | undefined)[][] = [];
    if (d2) list.push([d1, d1, d2, d2, nightId, nightId, offId, offId]); // 3 ca xoay 8h
    list.push([d1, d1, nightId, nightId, offId, offId]);
    list.push([d1, d1, d1, nightId, nightId, nightId, offId, offId, offId]);
    list.push([d1, nightId, offId, offId]);
    list.push([d1, d1, d1, d1, offId, offId, offId, offId]);
    return list
      .map((p) => p.filter((v): v is string => !!v))
      .filter((p) => p.length)
      .map((p) => ({ label: p.map(short).join('·'), p }));
  }, [types, d1, d2, nightId, offId]);

  const [mode, setMode] = useState<Mode>('cycle');
  const [pattern, setPattern] = useState<string[]>(presets[0]?.p ?? []);
  const [startDay, setStartDay] = useState(1);
  const [months, setMonths] = useState<1 | 3 | 6>(1);
  const [overwrite, setOverwrite] = useState(false);
  const [markHolidays, setMarkHolidays] = useState(true);

  const apply = () => {
    const empId = data.activeEmployeeId;
    const existing = data.schedule[empId] ?? {};
    const entries: Record<string, DayEntry> = {};
    const start = new Date(year, month - 1, Math.min(startDay, daysInMonth(year, month)));
    const end = new Date(year, month - 1 + months, 0);
    let i = 0;
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1), i++) {
      const key = keyOf(d);
      if (!overwrite && existing[key]?.shifts.length) continue;
      let id: string | undefined;
      if (markHolidays && holidayId) {
        const hols = getHolidays(d.getDate(), d.getMonth() + 1, d.getFullYear(), data.settings.language, data.customHolidays, data.settings.showDefaultHolidays);
        if (hols.some((h) => h.off)) id = holidayId;
      }
      if (!id) {
        if (mode === 'office') {
          const wd = d.getDay();
          id = wd === 0 || wd === 6 ? offId : d1;
        } else if (pattern.length) {
          id = pattern[i % pattern.length];
        }
      }
      if (id) entries[key] = { ...(existing[key] ?? {}), shifts: [id] };
    }
    setDays(empId, entries);
    maybeShowInterstitial();
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t.autoSchedule} onDone={apply} doneLabel={t.apply} doneDisabled={mode === 'cycle' && !pattern.length}>
      <Text style={{ color: c.text2, fontSize: 15, marginBottom: 14, textAlign: 'center' }}>{t.autoScheduleDesc}</Text>
      <Segmented
        style={{ marginBottom: 20 }}
        options={[
          { value: 'cycle', label: t.pattern },
          { value: 'office', label: `${t.kindDay} T2–T6` },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'cycle' && (
        <>
          <Text style={{ color: c.text2, fontSize: 13, marginLeft: 16, marginBottom: 8 }}>{t.presets.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {presets.map((p) => (
              <Chip key={p.label} label={p.label} active={p.p.join() === pattern.join()} onPress={() => setPattern(p.p)} />
            ))}
          </View>

          <Text style={{ color: c.text2, fontSize: 13, marginLeft: 16, marginBottom: 8 }}>
            {t.pattern.toUpperCase()} · {pattern.length} {t.days}
          </Text>
          <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 36 }}>
              {pattern.map((id, idx) => {
                const s = types.find((x) => x.id === id);
                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      haptic();
                      setPattern(pattern.filter((_, j) => j !== idx));
                    }}
                    style={{ backgroundColor: s?.color ?? c.gray, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{s?.short ?? '?'}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ height: 1, backgroundColor: c.separator, marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {types.map((s) => (
                <Chip key={s.id} label={`+ ${s.short}`} color={s.color} onPress={() => setPattern([...pattern, s.id])} />
              ))}
            </View>
          </View>
        </>
      )}

      <Group>
        <ListRow icon="calendar-number" iconColor={c.red} title={t.startDate} right={<Stepper value={startDay} onChange={setStartDay} min={1} max={daysInMonth(year, month)} />} />
        <ListRow
          icon="repeat"
          iconColor={c.indigo}
          title={t.month}
          right={<Segmented style={{ width: 120 }} options={[1, 3, 6].map((v) => ({ value: v as 1 | 3 | 6, label: `${v}` }))} value={months} onChange={(v) => (v === 1 || requirePro('autoLong')) && setMonths(v)} />}
        />
        <ListRow icon="gift" iconColor={c.pink} title={t.kindHoliday} right={<Toggle value={markHolidays} onChange={setMarkHolidays} />} />
        <ListRow icon="layers" iconColor={c.gray} title={t.overwrite} right={<Toggle value={overwrite} onChange={setOverwrite} />} />
      </Group>
    </Sheet>
  );
}
