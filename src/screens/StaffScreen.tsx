import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Btn, Chip, Group, haptic, IconBtn, InlineInput, LargeTitle, Screen, Sheet } from '../components/ui';
import { FREE_LIMITS } from '../pro';
import { computeMonth } from '../stats';
import { useStore } from '../store';
import { Employee } from '../types';
import { formatMoney, keyOf } from '../utils';

const AVATAR = ['#0A84FF', '#5E5CE6', '#FF9F0A', '#30D158', '#FF375F', '#BF5AF2', '#00C7BE', '#FF453A'];

export function StaffScreen({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  const { data, t, c, saveEmployee, deleteEmployee, setActiveEmployee, requirePro } = useStore();
  const [editing, setEditing] = useState<Partial<Employee> | null>(null);
  const [factory, setFactory] = useState<string | null>(null);
  const now = new Date();
  const todayKey = keyOf(now);

  const factories = useMemo(
    () => [...new Set(data.employees.map((e) => e.factory?.trim()).filter((f): f is string => !!f))],
    [data.employees],
  );
  const list = data.employees.filter((e) => !factory || e.factory?.trim() === factory);

  const save = () => {
    if (!editing?.name?.trim()) return;
    saveEmployee({ id: editing.id, name: editing.name.trim(), role: editing.role?.trim(), factory: editing.factory?.trim(), leaveDays: editing.leaveDays });
    setEditing(null);
  };

  return (
    <Screen>
      <LargeTitle eyebrow={`${data.employees.length} ${t.employees.toLowerCase()}`} title={t.tabStaff} right={<IconBtn name="person-add" filled onPress={() => (data.employees.length < FREE_LIMITS.employees || requirePro('staff')) && setEditing({ name: '' })} />} />

      {factories.length > 0 && (
        <View style={{ marginHorizontal: -16, marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            <Chip icon="business" label={t.allFactories} active={!factory} onPress={() => setFactory(null)} />
            {factories.map((f) => (
              <Chip key={f} label={f} active={factory === f} onPress={() => setFactory(f)} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ gap: 12 }}>
        {list.map((e, idx) => {
          const st = computeMonth(data, e.id, now.getFullYear(), now.getMonth() + 1);
          const today = (data.schedule[e.id]?.[todayKey]?.shifts ?? []).map((id) => data.shiftTypes.find((s) => s.id === id)).filter((x) => !!x);
          const active = e.id === data.activeEmployeeId;
          const col = AVATAR[idx % AVATAR.length];
          return (
            <Pressable
              key={e.id}
              onPress={() => {
                haptic();
                setActiveEmployee(e.id);
                onOpenCalendar();
              }}
              onLongPress={() => setEditing(e)}
              style={({ pressed }) => [{ backgroundColor: c.card, borderRadius: 16, padding: 14, opacity: pressed ? 0.85 : 1, borderWidth: 2, borderColor: active ? c.accent : 'transparent' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 19 }}>{e.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '600', fontSize: 17 }} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text style={{ color: c.text2, fontSize: 13, marginTop: 1 }} numberOfLines={1}>
                    {[e.role, e.factory].filter(Boolean).join(' · ') || (active ? t.active : '—')}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={() => setEditing(e)}>
                  <Ionicons name="ellipsis-horizontal-circle" size={26} color={c.text3} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}>
                <Text style={{ color: c.text2, fontSize: 13 }}>{t.today}:</Text>
                {today.length ? (
                  today.map((s, i) => (
                    <View key={i} style={{ backgroundColor: s.color, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{s.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: c.text3, fontSize: 13 }}>{t.noShift}</Text>
                )}
                <View style={{ flex: 1 }} />
                <Text style={{ color: c.green, fontWeight: '700', fontSize: 15 }}>{formatMoney(st.total)}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                <Mini label={t.workDays} value={st.workDays} color={c.accent} />
                <Mini label="OT" value={`${st.otHours}h`} color={c.orange} />
                <Mini label={t.nightShifts} value={st.nightShifts} color={c.indigo} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {editing && (
        <Sheet
          onClose={() => setEditing(null)}
          title={editing.id ? t.edit : t.addEmployee}
          onDone={save}
          doneDisabled={!editing.name?.trim()}
          footer={
            editing.id && data.employees.length > 1 ? (
              <Btn
                title={t.delete}
                kind="destructive"
                icon="trash-outline"
                style={{ flex: 1 }}
                onPress={() =>
                  Alert.alert(t.delete, t.confirmDeleteEmployee, [
                    { text: t.cancel, style: 'cancel' },
                    {
                      text: t.delete,
                      style: 'destructive',
                      onPress: () => {
                        deleteEmployee(editing.id!);
                        setEditing(null);
                      },
                    },
                  ])
                }
              />
            ) : undefined
          }
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 34, fontWeight: '700' }}>{(editing.name || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
          </View>
          <Group>
            <InlineInput label={t.employeeName} value={editing.name ?? ''} onChangeText={(v) => setEditing({ ...editing, name: v })} placeholder="…" autoFocus />
            <InlineInput label={t.role} value={editing.role ?? ''} onChangeText={(v) => setEditing({ ...editing, role: v })} placeholder="…" />
            <InlineInput label={t.factory} value={editing.factory ?? ''} onChangeText={(v) => setEditing({ ...editing, factory: v })} placeholder="…" />
          </Group>
          <Group footer={t.leaveHint}>
            <InlineInput
              label={t.leaveOwn}
              value={editing.leaveDays != null ? String(editing.leaveDays) : ''}
              onChangeText={(v) => setEditing({ ...editing, leaveDays: v.trim() === '' ? undefined : Number(v.replace(/[^\d]/g, '')) || 0 })}
              placeholder={String(data.settings.leaveDaysPerYear)}
              keyboardType="number-pad"
            />
          </Group>
        </Sheet>
      )}
    </Screen>
  );
}

function Mini({ label, value, color }: { label: string; value: string | number; color: string }) {
  const { c } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: c.dark ? c.card2 : c.bg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 }}>
      <Text style={{ color, fontSize: 17, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: c.text2, fontSize: 11 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
