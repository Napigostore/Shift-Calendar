import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useStore } from '../store';
import { SHIFT_COLORS } from '../theme';
import { ShiftKind, ShiftType } from '../types';
import { formatMoney, hoursBetween, isValidTime, uid } from '../utils';
import { Btn, Group, haptic, InlineInput, ListRow, Segmented, Sheet, Toggle } from './ui';
import { Text } from './AppText';
import { Icon } from './Icon';

export function ShiftEditor({ shift, onClose }: { shift: ShiftType | 'new' | null; onClose: () => void }) {
  if (!shift) return null;
  return <ShiftForm key={shift === 'new' ? 'new' : shift.id} shift={shift} onClose={onClose} />;
}

function ShiftForm({ shift, onClose }: { shift: ShiftType | 'new'; onClose: () => void }) {
  const { data, t, c, saveShift, deleteShift } = useStore();
  const [s, setS] = useState<ShiftType>(() =>
    shift === 'new'
      ? {
          id: uid(), name: '', short: '', kind: 'day', color: SHIFT_COLORS[data.shiftTypes.length % SHIFT_COLORS.length],
          start: '08:00', end: '17:00', hours: 8, pay: 0, otPay: data.settings.defaultOtRate, note: '', alarmEnabled: true, alarmTime: '07:30',
        }
      : { ...shift },
  );

  const set = (patch: Partial<ShiftType>) => setS({ ...s, ...patch });
  const setTime = (field: 'start' | 'end', v: string) => {
    const next = { ...s, [field]: v };
    if (isValidTime(next.start) && isValidTime(next.end) && (s.kind === 'day' || s.kind === 'night' || s.kind === 'ot')) {
      const raw = hoursBetween(next.start, next.end);
      next.hours = raw > 6 ? Math.max(0, raw - 1) : raw; // trừ 1h nghỉ giữa ca nếu ca dài
    }
    setS(next);
  };
  const num = (v: string) => Number(v.replace(/[^\d.]/g, '')) || 0;
  const valid = !!s.name.trim() && isValidTime(s.start) && isValidTime(s.end) && isValidTime(s.alarmTime);
  const timed = s.kind === 'day' || s.kind === 'night' || s.kind === 'ot';

  const kinds: { value: ShiftKind; label: string }[] = [
    { value: 'day', label: t.kindDay },
    { value: 'night', label: t.kindNight },
    { value: 'ot', label: 'OT' },
    { value: 'off', label: t.kindOff },
    { value: 'holiday', label: t.kindHoliday },
    { value: 'sick', label: t.kindSick },
    { value: 'leave', label: t.kindLeave },
  ];

  const save = () => {
    saveShift({ ...s, name: s.name.trim(), short: (s.short.trim() || s.name.trim().slice(0, 2)).toUpperCase() });
    onClose();
  };

  return (
    <Sheet
      onClose={onClose}
      title={shift === 'new' ? t.newShift : t.editShift}
      onDone={save}
      doneDisabled={!valid}
      footer={
        shift !== 'new' ? (
          <Btn
            title={t.delete}
            kind="destructive"
            icon="trash-outline"
            style={{ flex: 1 }}
            onPress={() =>
              Alert.alert(t.delete, s.name, [
                { text: t.cancel, style: 'cancel' },
                {
                  text: t.delete,
                  style: 'destructive',
                  onPress: () => {
                    deleteShift(s.id);
                    onClose();
                  },
                },
              ])
            }
          />
        ) : undefined
      }
    >
      {/* Xem trước */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 76, height: 76, borderRadius: 20, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 26 }}>{(s.short || s.name.slice(0, 2) || '?').toUpperCase()}</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', marginTop: 10 }}>{s.name || t.shiftName}</Text>
        {timed && (
          <Text style={{ color: c.text2, marginTop: 2 }}>
            {s.start} → {s.end} · {s.hours}
            {t.hours} · {formatMoney(s.pay)}
          </Text>
        )}
      </View>

      <Group>
        <InlineInput label={t.shiftName} value={s.name} onChangeText={(v) => set({ name: v })} placeholder="Day Shift" />
        <InlineInput label={t.shortName} value={s.short} maxLength={3} autoCapitalize="characters" onChangeText={(v) => set({ short: v })} placeholder="D" />
      </Group>

      <Segmented options={kinds} value={s.kind} onChange={(kind) => set({ kind })} style={{ marginBottom: 24 }} />

      <Group header={t.color}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12, justifyContent: 'center' }}>
          {SHIFT_COLORS.map((col) => (
            <Pressable
              key={col}
              onPress={() => {
                haptic();
                set({ color: col });
              }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}
            >
              {s.color === col ? <Icon name="checkmark" size={22} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
      </Group>

      {timed && (
        <Group header={t.workHours}>
          <InlineInput label={t.startTime} value={s.start} onChangeText={(v) => setTime('start', v)} placeholder="08:00" keyboardType="numbers-and-punctuation" />
          <InlineInput label={t.endTime} value={s.end} onChangeText={(v) => setTime('end', v)} placeholder="17:00" keyboardType="numbers-and-punctuation" />
          <InlineInput label={t.workHours} value={String(s.hours)} onChangeText={(v) => set({ hours: num(v) })} keyboardType="decimal-pad" />
        </Group>
      )}

      <Group header={t.salary}>
        <InlineInput label={t.payPerShift} value={String(s.pay)} onChangeText={(v) => set({ pay: num(v) })} keyboardType="number-pad" />
        <InlineInput label={t.otPayHour} value={String(s.otPay)} onChangeText={(v) => set({ otPay: num(v) })} keyboardType="number-pad" />
      </Group>

      <Group>
        <ListRow icon="alarm" iconColor={c.orange} title={t.alarm} right={<Toggle value={s.alarmEnabled} onChange={(v) => set({ alarmEnabled: v })} />} />
        {s.alarmEnabled ? <InlineInput label={t.alarmTime} value={s.alarmTime} onChangeText={(v) => set({ alarmTime: v })} placeholder="07:30" keyboardType="numbers-and-punctuation" /> : null}
      </Group>

      <Group header={t.note}>
        <InlineInput label="" value={s.note} onChangeText={(v) => set({ note: v })} placeholder="…" style={{ textAlign: 'left', flex: 6 }} />
      </Group>
    </Sheet>
  );
}
