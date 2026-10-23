import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getHolidays } from '../holidays';
import { canChiYear, solarToLunar } from '../lunar';
import { computeDay } from '../stats';
import { useStore } from '../store';
import { formatMoney, formatTime, parseKey } from '../utils';
import { StickerPicker } from './StickerPicker';
import { Btn, Field, Group, haptic, ListRow, Sheet, Stepper } from './ui';

export function DayEditor({ dayKey, onClose }: { dayKey: string | null; onClose: () => void }) {
  if (!dayKey) return null;
  return <DayForm key={dayKey} dayKey={dayKey} onClose={onClose} />;
}

function DayForm({ dayKey, onClose }: { dayKey: string; onClose: () => void }) {
  const { data, t, c, setDay } = useStore();
  const empId = data.activeEmployeeId;
  const entry = data.schedule[empId]?.[dayKey];
  const [shifts, setShifts] = useState<string[]>(() => entry?.shifts ?? []);
  const [ot, setOt] = useState(() => entry?.otHours ?? 0);
  const [note, setNote] = useState(() => entry?.note ?? '');
  const [icons, setIcons] = useState<string[]>(() => entry?.icons ?? []);

  const [y, m, d] = parseKey(dayKey);
  const date = new Date(y, m - 1, d);
  const lunar = solarToLunar(d, m, y);
  const s = data.settings;
  const hols = getHolidays(d, m, y, s.language, data.customHolidays, s.showDefaultHolidays, s.holidayIcon);
  const max = s.shiftsPerDay;
  const preview = computeDay(data, { shifts, otHours: ot, note }, dayKey, d, date.getDay());

  const toggle = (id: string) => {
    haptic();
    setShifts((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (max === 1) return [id];
      return [...cur, id].slice(-max);
    });
  };

  const save = () => {
    setDay(empId, dayKey, { shifts, otHours: ot || undefined, note: note.trim() || undefined, icons: icons.length ? icons : undefined });
    onClose();
  };

  return (
    <Sheet
      onClose={onClose}
      onDone={save}
      title={t.editDay}
      footer={
        <Btn
          title={t.clear}
          kind="destructive"
          icon="trash-outline"
          style={{ flex: 1 }}
          onPress={() => {
            setDay(empId, dayKey, null);
            onClose();
          }}
        />
      }
    >
      {/* Tiêu đề ngày */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 14 }}>
        <View style={{ width: 58, height: 58, borderRadius: 14, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.red, fontSize: 11, fontWeight: '700' }}>{t.weekdaysShort[date.getDay()].toUpperCase()}</Text>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: '700', marginTop: -2 }}>{d}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>
            {t.weekdaysLong[date.getDay()]}, {d}/{m}/{y}
          </Text>
          <Text style={{ color: c.text2, fontSize: 14, marginTop: 2 }}>
            {t.lunar} {lunar.day}/{lunar.month}
            {lunar.leap ? ` (${t.leap})` : ''} · {canChiYear(lunar.year)}
          </Text>
        </View>
        {icons.length ? <Text style={{ fontSize: 26 }}>{icons.join('')}</Text> : null}
      </View>

      {hols.length > 0 && (
        <Group>
          {hols.map((h, i) => (
            <ListRow key={i} emoji={h.icon} title={h.name} subtitle={h.off ? t.isOffDay : undefined} titleStyle={h.off ? { color: c.red } : undefined} />
          ))}
        </Group>
      )}

      {/* Chọn ca */}
      <Group header={`${t.selectShift}${max > 1 ? ` · ≤ ${max}` : ''}`}>
        {data.shiftTypes.map((sh) => {
          const on = shifts.includes(sh.id);
          return (
            <Pressable key={sh.id} onPress={() => toggle(sh.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 14 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: sh.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{sh.short}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 17 }}>{sh.name}</Text>
                  {sh.hours > 0 && (
                    <Text style={{ color: c.text2, fontSize: 13, marginTop: 1 }}>
                      {formatTime(sh.start, s.clock24h)} – {formatTime(sh.end, s.clock24h)}
                      {sh.alarmEnabled ? `  ·  ⏰ ${formatTime(sh.alarmTime, s.clock24h)}` : ''}
                    </Text>
                  )}
                </View>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={on ? c.accent : c.text3} />
              </View>
            </Pressable>
          );
        })}
      </Group>

      <Group>
        <ListRow icon="flash" iconColor={c.orange} title={t.otHours} right={<Stepper value={ot} onChange={setOt} step={0.5} max={16} />} />
        {s.features.salary ? <ListRow icon="cash" iconColor={c.green} title={t.salary} value={formatMoney(preview.total)} /> : null}
      </Group>

      {s.features.stickers && (
        <>
          <Text style={{ color: c.text2, fontSize: 13, marginLeft: 16, marginBottom: 7 }}>{t.stickers.toUpperCase()}</Text>
          <StickerPicker value={icons} onChange={setIcons} />
          <Text style={{ color: c.text2, fontSize: 13, marginHorizontal: 16, marginTop: 7, marginBottom: 20 }}>{t.stickerHint}</Text>
        </>
      )}

      <Field label={t.note} value={note} onChangeText={setNote} placeholder="…" multiline />
    </Sheet>
  );
}
